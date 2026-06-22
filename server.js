const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const initializeDatabase = require('./init_db');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support base64 image attachments
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hostelfix',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper: Get full state from database
async function getFullState() {
  const [complaintsRows] = await pool.query('SELECT * FROM complaints ORDER BY createdTime DESC');
  const [logsRows] = await pool.query('SELECT * FROM complaint_logs ORDER BY time ASC');
  const [workersRows] = await pool.query('SELECT * FROM workers');
  const [notificationsRows] = await pool.query('SELECT * FROM notifications ORDER BY time DESC');
  const [credentialsRows] = await pool.query('SELECT * FROM credentials');

  // Map logs to complaints
  const logsMap = {};
  logsRows.forEach(log => {
    if (!logsMap[log.complaintId]) {
      logsMap[log.complaintId] = [];
    }
    logsMap[log.complaintId].push({
      status: log.status,
      time: log.time,
      note: log.note
    });
  });

  const complaints = complaintsRows.map(c => ({
    id: c.id,
    studentName: c.studentName,
    room: c.room,
    block: c.block,
    category: c.category,
    urgency: c.urgency,
    title: c.title,
    desc: c.description,
    status: c.status,
    workerId: c.workerId,
    priority: c.priority,
    expectedCompletionDate: c.expectedCompletionDate ? c.expectedCompletionDate.toISOString().split('T')[0] : null,
    createdTime: c.createdTime,
    image: c.image,
    rating: c.rating,
    comment: c.comment,
    logs: logsMap[c.id] || []
  }));

  const workers = workersRows.map(w => ({
    id: w.id,
    name: w.name,
    category: w.category,
    rating: parseFloat(w.rating) || 5.0,
    activeJobs: 0,   // Will be computed on frontend or updated
    completedJobs: 0
  }));

  const notifications = notificationsRows.map(n => ({
    id: n.id,
    role: n.role,
    message: n.message,
    time: n.time,
    read: Boolean(n.is_read)
  }));

  const credentials = {};
  credentialsRows.forEach(row => {
    if (row.role === 'student') {
      credentials.student = { reg: row.username, password: row.password };
    } else if (row.role === 'admin') {
      credentials.admin = { username: row.username, password: row.password };
    }
  });

  return {
    complaints,
    workers,
    notifications,
    credentials
  };
}

// REST Endpoints

// 1. Get full state
app.get('/api/state', async (req, res) => {
  try {
    const state = await getFullState();
    res.json(state);
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// 2. Raise Complaint
app.post('/api/complaints', async (req, res) => {
  const { id, studentName, room, block, category, urgency, title, desc, status, createdTime, image } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert complaint
    await connection.query(
      `INSERT INTO complaints (id, studentName, room, block, category, urgency, title, description, status, createdTime, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    , [id, studentName, room, block, category, urgency, title, desc, status, createdTime, image]);

    // Insert initial log
    const note = `Ticket filed by ${studentName} (Room ${room})`;
    await connection.query(
      `INSERT INTO complaint_logs (complaintId, status, time, note)
       VALUES (?, ?, ?, ?)`
    , [id, 'submitted', createdTime, note]);

    // Insert notification for Admin
    const adminNotifId = 'n_' + Date.now();
    const adminMsg = `New complaint ${id} filed: "${title}" by student ${studentName}.`;
    await connection.query(
      `INSERT INTO notifications (id, role, message, time, is_read)
       VALUES (?, 'admin', ?, ?, false)`
    , [adminNotifId, adminMsg, createdTime]);

    // Insert notification for Student
    const studentNotifId = 'n_' + (Date.now() + 1);
    const studentMsg = `Ticket ${id} created successfully. Warden review pending.`;
    await connection.query(
      `INSERT INTO notifications (id, role, message, time, is_read)
       VALUES (?, 'student', ?, ?, false)`
    , [studentNotifId, studentMsg, createdTime]);

    await connection.commit();
    res.json({ success: true, message: 'Complaint registered successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error raising complaint:', error);
    res.status(500).json({ error: 'Failed to raise complaint' });
  } finally {
    connection.release();
  }
});

// 3. Verify Complaint
app.post('/api/complaints/:id/verify', async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE complaints SET status = "verified" WHERE id = ?', [id]);

    await connection.query(
      'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "verified", ?, ?)'
    , [id, now, 'Admin verified and approved ticket.']);

    const notifId = 'n_' + Date.now();
    const msg = `Your complaint ${id} has been verified and is ready for worker dispatching.`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "student", ?, ?, false)'
    , [notifId, msg, now]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error verifying complaint:', error);
    res.status(500).json({ error: 'Failed to verify complaint' });
  } finally {
    connection.release();
  }
});

// 4. Reject Complaint
app.post('/api/complaints/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE complaints SET status = "rejected" WHERE id = ?', [id]);

    const note = `Rejected by Admin. Reason: ${reason || 'N/A'}`;
    await connection.query(
      'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "rejected", ?, ?)'
    , [id, now, note]);

    const notifId = 'n_' + Date.now();
    const msg = `Your complaint ${id} was rejected. Reason: ${reason || 'Invalid report details.'}`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "student", ?, ?, false)'
    , [notifId, msg, now]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting complaint:', error);
    res.status(500).json({ error: 'Failed to reject complaint' });
  } finally {
    connection.release();
  }
});

// 5. Mark Completed (Warden sign-off)
app.post('/api/complaints/:id/complete', async (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE complaints SET status = "completed" WHERE id = ?', [id]);

    await connection.query(
      'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "completed", ?, ?)'
    , [id, now, 'Admin signed off technician repairs.']);

    const notifId = 'n_' + Date.now();
    const msg = `Your complaint ${id} has been resolved. Please review and close or reopen.`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "student", ?, ?, false)'
    , [notifId, msg, now]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error completing complaint:', error);
    res.status(500).json({ error: 'Failed to complete complaint' });
  } finally {
    connection.release();
  }
});

// 6. Assign/Dispatch Worker
app.post('/api/complaints/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { workerId, workerName, priority, dueDate } = req.body;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE complaints 
       SET workerId = ?, priority = ?, expectedCompletionDate = ?, status = 'assigned', urgency = ? 
       WHERE id = ?`
    , [workerId, priority, dueDate, priority, id]);

    const note = `Dispatched technician ${workerName}. Deadline: ${dueDate}. Priority: ${priority}`;
    await connection.query(
      'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "assigned", ?, ?)'
    , [id, now, note]);

    const notifId = 'n_' + Date.now();
    const msg = `Technician ${workerName} has been dispatched for complaint ${id}. Expected completion: ${dueDate}.`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "student", ?, ?, false)'
    , [notifId, msg, now]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error assigning worker:', error);
    res.status(500).json({ error: 'Failed to assign worker' });
  } finally {
    connection.release();
  }
});

// 6.5 Accept Job (by Worker)
app.post('/api/complaints/:id/accept', async (req, res) => {
  const { id } = req.params;
  const { workerName } = req.body;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE complaints 
       SET status = 'inprogress' 
       WHERE id = ?`
    , [id]);

    const note = `Technician ${workerName} accepted the job.`;
    await connection.query(
      'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "inprogress", ?, ?)'
    , [id, now, note]);

    // Notify Student
    const notifId = 'n_' + Date.now();
    const msg = `Technician ${workerName} has accepted your complaint ${id} and started working on it.`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "student", ?, ?, false)'
    , [notifId, msg, now]);

    // Notify Admin
    const adminNotifId = 'n_' + (Date.now() + 1);
    const adminMsg = `Technician ${workerName} accepted complaint ${id}.`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "admin", ?, ?, false)'
    , [adminNotifId, adminMsg, now]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error accepting job:', error);
    res.status(500).json({ error: 'Failed to accept job' });
  } finally {
    connection.release();
  }
});

// 6.6 Mark Fixed (by Worker)
app.post('/api/complaints/:id/fix', async (req, res) => {
  const { id } = req.params;
  const { workerName } = req.body;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE complaints 
       SET status = 'fixed' 
       WHERE id = ?`
    , [id]);

    const note = `Technician ${workerName} marked the repair as completed.`;
    await connection.query(
      'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "fixed", ?, ?)'
    , [id, now, note]);

    // Notify Student
    const notifId = 'n_' + Date.now();
    const msg = `Technician ${workerName} has completed repairs for complaint ${id}. Awaiting Warden sign-off.`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "student", ?, ?, false)'
    , [notifId, msg, now]);

    // Notify Admin
    const adminNotifId = 'n_' + (Date.now() + 1);
    const adminMsg = `Technician ${workerName} marked complaint ${id} as fixed. Action required: Warden sign-off.`;
    await connection.query(
      'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "admin", ?, ?, false)'
    , [adminNotifId, adminMsg, now]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error marking job fixed:', error);
    res.status(500).json({ error: 'Failed to mark job fixed' });
  } finally {
    connection.release();
  }
});

// 7. Resident Feedback (Close or Reopen)
app.post('/api/complaints/:id/feedback', async (req, res) => {
  const { id } = req.params;
  const { status, rating, comment } = req.body;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (status === 'closed') {
      await connection.query(
        'UPDATE complaints SET status = "closed", rating = ?, comment = ? WHERE id = ?'
      , [rating, comment, id]);

      const note = `Resident signed off. Rating: ${rating} stars. Comment: ${comment}`;
      await connection.query(
        'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "closed", ?, ?)'
      , [id, now, note]);

    } else if (status === 'reopened') {
      await connection.query(
        'UPDATE complaints SET status = "reopened", rating = NULL, comment = NULL WHERE id = ?'
      , [id]);

      const note = `Resident reopened ticket. Note: ${comment}`;
      await connection.query(
        'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, "reopened", ?, ?)'
      , [id, now, note]);

      // Notify Admin
      const adminNotifId = 'n_' + Date.now();
      const adminMsg = `Resident reopened complaint ${id}: "${comment.substring(0, 40)}...".`;
      await connection.query(
        'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "admin", ?, ?, false)'
      , [adminNotifId, adminMsg, now]);
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording feedback:', error);
    res.status(500).json({ error: 'Failed to update ticket feedback' });
  } finally {
    connection.release();
  }
});

// 8. Add Worker
app.post('/api/workers', async (req, res) => {
  const { id, name, category, rating } = req.body;
  try {
    await pool.query(
      'INSERT INTO workers (id, name, category, rating) VALUES (?, ?, ?, ?)'
    , [id, name, category, rating || 5.0]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ error: 'Failed to add worker' });
  }
});

// 9. Update Worker (Edit)
app.put('/api/workers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, rating } = req.body;
  try {
    await pool.query(
      'UPDATE workers SET name = ?, category = ?, rating = ? WHERE id = ?'
    , [name, category, rating, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// 10. Delete Worker
app.delete('/api/workers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM workers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

// 11. Mark Notification as Read
app.post('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// 12. Change Password
app.post('/api/auth/password', async (req, res) => {
  const { role, password } = req.body;
  try {
    await pool.query('UPDATE credentials SET password = ? WHERE role = ?', [password, role]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to update credentials' });
  }
});

// 12.5 Manual Update Complaint Status
app.post('/api/complaints/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const now = new Date().toISOString();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);

    const note = `Status updated manually by Admin to: ${status.toUpperCase()}.`;
    await connection.query(
      'INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, ?, ?, ?)'
    , [id, status, now, note]);

    if (status === 'completed') {
      const notifId = 'n_' + Date.now();
      const msg = `Warden has marked your complaint ${id} as Completed. Please review.`;
      await connection.query(
        'INSERT INTO notifications (id, role, message, time, is_read) VALUES (?, "student", ?, ?, false)'
      , [notifId, msg, now]);
    }

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error manually updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  } finally {
    connection.release();
  }
});

// 13. Reset Database (Re-seeds MySQL)
app.post('/api/reset', async (req, res) => {
  try {
    await initializeDatabase();
    const state = await getFullState();
    res.json(state);
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// 14. Workflow Auto-Simulation step
app.post('/api/simulate-step', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Find candidate complaint that is not closed or rejected
    const [candidates] = await connection.query(
      `SELECT * FROM complaints 
       WHERE status IN ('submitted', 'verified', 'assigned', 'inprogress', 'fixed', 'completed', 'reopened')
       LIMIT 1`
    );

    if (candidates.length === 0) {
      await connection.commit();
      return res.json({ success: false, message: 'All complaints are already closed! Submit a new complaint to test.' });
    }

    const candidate = candidates[0];
    const now = new Date().toISOString();
    let updatedStatus = '';
    let logNote = '';
    let toastMsg = '';

    if (candidate.status === 'submitted' || candidate.status === 'reopened') {
      updatedStatus = 'verified';
      logNote = '[Simulated] Admin checked & verified complaint legitimacy.';
      toastMsg = `Simulated: Admin verified complaint ${candidate.id}`;

      await connection.query('UPDATE complaints SET status = ? WHERE id = ?', [updatedStatus, candidate.id]);
      await connection.query('INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, ?, ?, ?)', [candidate.id, updatedStatus, now, logNote]);

    } else if (candidate.status === 'verified') {
      // Find worker of same category, or first worker
      const [workers] = await connection.query('SELECT * FROM workers');
      const worker = workers.find(w => w.category.toLowerCase() === candidate.category.toLowerCase()) || workers[0];
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      updatedStatus = 'assigned';
      logNote = `[Simulated] Dispatched specialist ${worker.name}. Due: ${dueDate}`;
      toastMsg = `Simulated: Dispatched technician ${worker.name} for ${candidate.id}`;

      await connection.query(
        `UPDATE complaints 
         SET workerId = ?, status = ?, priority = 'medium', expectedCompletionDate = ?, urgency = 'medium' 
         WHERE id = ?`
      , [worker.id, updatedStatus, dueDate, candidate.id]);

      await connection.query('INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, ?, ?, ?)', [candidate.id, updatedStatus, now, logNote]);

    } else if (candidate.status === 'assigned') {
      updatedStatus = 'inprogress';
      logNote = '[Simulated] Worker arrived at room and commenced diagnostic work.';
      toastMsg = `Simulated: Worker started repair on ${candidate.id}`;

      await connection.query('UPDATE complaints SET status = ? WHERE id = ?', [updatedStatus, candidate.id]);
      await connection.query('INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, ?, ?, ?)', [candidate.id, updatedStatus, now, logNote]);

    } else if (candidate.status === 'inprogress') {
      updatedStatus = 'fixed';
      logNote = '[Simulated] Repair complete. Restructured components and tested functionality.';
      toastMsg = `Simulated: Worker marked ${candidate.id} as Fixed`;

      await connection.query('UPDATE complaints SET status = ? WHERE id = ?', [updatedStatus, candidate.id]);
      await connection.query('INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, ?, ?, ?)', [candidate.id, updatedStatus, now, logNote]);

    } else if (candidate.status === 'fixed') {
      updatedStatus = 'completed';
      logNote = '[Simulated] Admin inspected completion and signed off.';
      toastMsg = `Simulated: Admin checked repairs and marked ${candidate.id} Completed`;

      await connection.query('UPDATE complaints SET status = ? WHERE id = ?', [updatedStatus, candidate.id]);
      await connection.query('INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, ?, ?, ?)', [candidate.id, updatedStatus, now, logNote]);

    } else if (candidate.status === 'completed') {
      updatedStatus = 'closed';
      logNote = '[Simulated] Resident signed off. Rating: 5 stars.';
      toastMsg = `Simulated: Student accepted repairs. Ticket ${candidate.id} is now CLOSED!`;

      await connection.query(
        `UPDATE complaints 
         SET status = ?, rating = 5, comment = '[Simulated] Issue resolved successfully. Closed ticket.' 
         WHERE id = ?`
      , [updatedStatus, candidate.id]);

      await connection.query('INSERT INTO complaint_logs (complaintId, status, time, note) VALUES (?, ?, ?, ?)', [candidate.id, updatedStatus, now, logNote]);
    }

    await connection.commit();
    res.json({ success: true, toastMsg });
  } catch (error) {
    await connection.rollback();
    console.error('Error running simulation step:', error);
    res.status(500).json({ error: 'Failed to execute simulation step' });
  } finally {
    connection.release();
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    console.log('Auto-initializing database on startup...');
    await initializeDatabase();
    console.log('Database auto-initialization successful.');
  } catch (err) {
    console.error('Database auto-initialization failed:', err);
  }
});
