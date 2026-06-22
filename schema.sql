CREATE DATABASE IF NOT EXISTS hostelfix;
USE hostelfix;

-- Drop tables if they exist to support database reset
DROP TABLE IF EXISTS complaint_logs;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS workers;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS credentials;

-- Create credentials table
CREATE TABLE credentials (
    role VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL
);

-- Create workers table
CREATE TABLE workers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    rating DECIMAL(3, 1) DEFAULT 5.0
);

-- Create complaints table
CREATE TABLE complaints (
    id VARCHAR(50) PRIMARY KEY,
    studentName VARCHAR(100) NOT NULL,
    room VARCHAR(50) NOT NULL,
    block VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    urgency VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    workerId VARCHAR(50),
    priority VARCHAR(50),
    expectedCompletionDate DATE,
    createdTime VARCHAR(100) NOT NULL,
    image LONGTEXT,
    rating INT,
    comment TEXT,
    FOREIGN KEY (workerId) REFERENCES workers(id) ON DELETE SET NULL
);

-- Create complaint logs table
CREATE TABLE complaint_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaintId VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    time VARCHAR(100) NOT NULL,
    note TEXT NOT NULL,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE
);

-- Create notifications table
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    time VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE
);

-- Seed credentials
INSERT INTO credentials (role, username, password) VALUES
('student', '2026CSE0302', 'student123'),
('admin', 'admin', 'admin123');

-- Seed workers
INSERT INTO workers (id, name, category, rating) VALUES
('w1', 'Ramesh Kumar', 'Plumbing', 4.8),
('w2', 'Suresh Patel', 'Electrical', 4.9),
('w3', 'Jagdish Singh', 'Furniture', 4.5),
('w4', 'Amit Sharma', 'Cleaning', 4.7),
('w5', 'Karan Johar', 'Appliance', 4.6),
('w6', 'Devendra Verma', 'Internet', 4.3);

-- Seed complaints
INSERT INTO complaints (id, studentName, room, block, category, urgency, title, description, status, workerId, priority, expectedCompletionDate, createdTime, image, rating, comment) VALUES
('C-101', 'Aarav Mehta', '302', 'Block B', 'Plumbing', 'high', 'Bathroom flush tank leaking', 'The flush tank in room B-302 toilet is constantly leaking water, making a continuous noise and wasting water.', 'closed', 'w1', 'high', '2026-06-12', '2026-06-11T09:30:00.000Z', NULL, 5, 'Quick and clean repair. Ramesh was very professional.'),
('C-102', 'Aarav Mehta', '302', 'Block B', 'Electrical', 'medium', 'Ceiling fan making clicking sound', 'The ceiling fan at speed 3 makes a loud clicking noise. Speed is also very slow.', 'submitted', NULL, NULL, NULL, '2026-06-13T10:15:00.000Z', NULL, NULL, NULL),
('C-103', 'Aarav Mehta', '302', 'Block B', 'Internet', 'low', 'LAN port not getting IP address', 'Wired LAN port near desk is dead. Wi-Fi works but LAN port does not connect.', 'assigned', 'w6', 'medium', '2026-06-15', '2026-06-12T14:00:00.000Z', NULL, NULL, NULL),
('C-104', 'Vijay K', '108', 'Block A', 'Cleaning', 'high', 'Water clogging in corridor', 'After the rain, water has accumulated in front of rooms. Very bad odor.', 'inprogress', 'w4', 'high', '2026-06-14', '2026-06-13T08:00:00.000Z', NULL, NULL, NULL),
('C-105', 'Vijay K', '108', 'Block A', 'Furniture', 'medium', 'Bed wooden plank cracked', 'The center wooden plank supporting the mattress is cracked. Sagging a lot.', 'completed', 'w3', 'medium', '2026-06-14', '2026-06-12T10:00:00.000Z', NULL, NULL, NULL);

-- Seed complaint logs
INSERT INTO complaint_logs (complaintId, status, time, note) VALUES
('C-101', 'submitted', '2026-06-11T09:30:00.000Z', 'Complaint filed'),
('C-101', 'verified', '2026-06-11T11:15:00.000Z', 'Warden verified and approved'),
('C-101', 'assigned', '2026-06-11T12:00:00.000Z', 'Assigned to Ramesh Kumar'),
('C-101', 'inprogress', '2026-06-11T14:10:00.000Z', 'Worker started repairs'),
('C-101', 'fixed', '2026-06-11T15:30:00.000Z', 'Worker replaced flush washer'),
('C-101', 'completed', '2026-06-11T16:00:00.000Z', 'Warden signed off completion'),
('C-101', 'closed', '2026-06-11T17:30:00.000Z', 'Student accepted. Rating: 5 stars.'),
('C-102', 'submitted', '2026-06-13T10:15:00.000Z', 'Complaint filed'),
('C-103', 'submitted', '2026-06-12T14:00:00.000Z', 'Complaint filed'),
('C-103', 'verified', '2026-06-12T16:30:00.000Z', 'Warden verified and approved'),
('C-103', 'assigned', '2026-06-13T09:00:00.000Z', 'Assigned to Devendra Verma'),
('C-104', 'submitted', '2026-06-13T08:00:00.000Z', 'Complaint filed'),
('C-104', 'verified', '2026-06-13T08:30:00.000Z', 'Warden verified and approved'),
('C-104', 'assigned', '2026-06-13T09:15:00.000Z', 'Assigned to Amit Sharma'),
('C-104', 'inprogress', '2026-06-13T11:00:00.000Z', 'Worker started cleaning'),
('C-105', 'submitted', '2026-06-12T10:00:00.000Z', 'Complaint filed'),
('C-105', 'verified', '2026-06-12T11:00:00.000Z', 'Warden approved'),
('C-105', 'assigned', '2026-06-12T11:30:00.000Z', 'Assigned to Jagdish Singh'),
('C-105', 'inprogress', '2026-06-12T14:00:00.000Z', 'Worker checking plank sizing'),
('C-105', 'fixed', '2026-06-13T12:00:00.000Z', 'Worker replaced the cracked central support board.'),
('C-105', 'completed', '2026-06-13T14:30:00.000Z', 'Warden inspected and signed off repairs');

-- Seed notifications
INSERT INTO notifications (id, role, message, time, is_read) VALUES
('n1', 'student', 'Warden has verified your complaint C-103: "LAN port not getting IP address".', '2026-06-12T16:30:00.000Z', false),
('n2', 'student', 'Technician Jagdish Singh has fixed your issue C-105. Warden has verified and signed off. Please review.', '2026-06-13T14:35:00.000Z', false);
