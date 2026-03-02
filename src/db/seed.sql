-- Seed data for Unigate
-- Admin password: admin123 (bcrypt hash)

-- Admin user
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@unigate.rw', '$2a$10$8KzaNdKIMyOkASCakNLzHesVDhGgmHfOPZJMoSK2YXJBK8XpZP0e', 'admin');

-- Sample student
INSERT INTO users (name, email, password_hash, role) VALUES
('John Doe', 'student@unigate.rw', '$2a$10$8KzaNdKIMyOkASCakNLzHesVDhGgmHfOPZJMoSK2YXJBK8XpZP0e', 'student');

-- Combinations
INSERT INTO combinations (code, name) VALUES
('MPC', 'Mathematics-Physics-Computer Science'),
('MCB', 'Mathematics-Chemistry-Biology'),
('MEG', 'Mathematics-Economics-Geography'),
('HEG', 'History-Economics-Geography'),
('PCM', 'Physics-Chemistry-Mathematics'),
('PCB', 'Physics-Chemistry-Biology'),
('MCE', 'Mathematics-Civil Engineering-Economics'),
('MPG', 'Mathematics-Physics-Geography');

-- Faculties
INSERT INTO faculties (name, description) VALUES
('Engineering', 'Design, build, and optimise systems across multiple engineering disciplines.'),
('Computer Science', 'Study algorithms, software development, and computational theory.'),
('Physics', 'Explore fundamental laws of nature through theory and experimentation.'),
('Mathematics', 'Develop abstract reasoning and problem-solving skills in pure and applied mathematics.'),
('Medicine', 'Train as a medical doctor to diagnose and treat human diseases.'),
('Pharmacy', 'Study drug formulation, pharmacology, and pharmaceutical sciences.'),
('Biotechnology', 'Apply biological processes to develop medical and industrial technologies.'),
('Nursing', 'Provide patient care and health education in clinical settings.'),
('Economics', 'Analyse economic systems and policy-making at micro and macro levels.'),
('Business Administration', 'Learn management, operations, and organisational strategy.'),
('Statistics', 'Apply statistical methods to research, data analysis, and forecasting.'),
('Finance', 'Study financial markets, investment, and corporate finance.'),
('Law', 'Study legal systems, constitutional frameworks, and justice.'),
('Political Science', 'Examine political theory, governance, and policy analysis.'),
('Public Administration', 'Focus on public sector management and government operations.'),
('International Relations', 'Analyse diplomacy, global governance, and international cooperation.'),
('Architecture', 'Plan and design buildings and urban spaces.'),
('Applied Mathematics', 'Apply mathematical modelling to real-world problems.'),
('Information Technology', 'Develop and maintain information systems and digital solutions.'),
('Biology', 'Study living organisms, ecosystems, and biological processes.'),
('Environmental Science', 'Address environmental challenges through science and policy.'),
('Agriculture', 'Improve agricultural productivity and food security.'),
('Civil Engineering', 'Design and oversee public infrastructure projects.'),
('Urban Planning', 'Plan sustainable cities and communities.'),
('Surveying', 'Measure and map land for construction and legal purposes.'),
('Construction Management', 'Manage construction projects from planning to completion.'),
('Geography', 'Study physical and human landscapes across the globe.'),
('Environmental Management', 'Manage natural resources and environmental conservation efforts.'),
('Geology', 'Examine the earth''s structure, composition, and geological history.'),
('Meteorology', 'Forecast weather and study atmospheric phenomena.');

-- Combination-Faculty mappings
-- MPC (id=1): Engineering(1), Computer Science(2), Physics(3), Mathematics(4)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4);

-- MCB (id=2): Medicine(5), Pharmacy(6), Biotechnology(7), Nursing(8)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(2, 5), (2, 6), (2, 7), (2, 8);

-- MEG (id=3): Economics(9), Business Administration(10), Statistics(11), Finance(12)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(3, 9), (3, 10), (3, 11), (3, 12);

-- HEG (id=4): Law(13), Political Science(14), Public Administration(15), International Relations(16)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(4, 13), (4, 14), (4, 15), (4, 16);

-- PCM (id=5): Engineering(1), Architecture(17), Applied Mathematics(18), Information Technology(19)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(5, 1), (5, 17), (5, 18), (5, 19);

-- PCB (id=6): Medicine(5), Biology(20), Environmental Science(21), Agriculture(22)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(6, 5), (6, 20), (6, 21), (6, 22);

-- MCE (id=7): Civil Engineering(23), Urban Planning(24), Surveying(25), Construction Management(26)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(7, 23), (7, 24), (7, 25), (7, 26);

-- MPG (id=8): Geography(27), Environmental Management(28), Geology(29), Meteorology(30)
INSERT INTO combination_faculty (combination_id, faculty_id) VALUES
(8, 27), (8, 28), (8, 29), (8, 30);

-- Scholarships
INSERT INTO scholarships (title, university, country, description, requirements, deadline, form_link, status, created_by) VALUES
('STEM Excellence Scholarship 2026', 'University of Tokyo', 'Japan', 'A fully funded scholarship for outstanding students pursuing STEM disciplines at the graduate level.', 'Minimum GPA 3.5, STEM background required', '2026-06-30', '#', 'Open', 1),
('African Leaders Scholarship', 'University of Cape Town', 'South Africa', 'Supporting future African leaders with full tuition coverage and a living stipend for undergraduate study.', 'African citizenship, leadership experience', '2026-04-15', '#', 'Open', 1),
('Global Engineering Fellowship', 'MIT', 'United States', 'A competitive fellowship for engineering students demonstrating academic excellence and innovation.', 'Engineering background, research experience preferred', '2026-03-01', '#', 'Closed', 1),
('Commonwealth Scholarship', 'University of Oxford', 'United Kingdom', 'Open to Commonwealth citizens for postgraduate study in any subject at the University of Oxford.', 'Commonwealth citizenship, strong academic record', '2026-05-20', '#', 'Open', 1);

-- Jobs
INSERT INTO jobs (company, title, description, qualifications, experience_level, deadline, form_link, status, created_by) VALUES
('TechCorp Rwanda', 'Junior Software Developer', 'Develop and maintain web applications using modern frameworks. Ideal for recent graduates with a passion for technology.', 'BSc in Computer Science or related field', 'Entry Level', '2026-05-15', '#', 'Open', 1),
('National Bank', 'Finance Analyst Intern', 'Assist the finance team with data analysis, reporting, and market research. Open to current students.', 'Currently pursuing degree in Finance or Economics', 'Internship', '2026-04-30', '#', 'Open', 1),
('HealthPlus', 'Lab Technician', 'Perform laboratory tests and procedures in a clinical setting. Requires relevant certification.', 'Diploma in Medical Laboratory Technology', '1-2 Years', '2026-03-20', '#', 'Closed', 1);

-- Past papers (placeholder file paths)
INSERT INTO past_papers (subject, year, level, file_path, original_filename, uploaded_by) VALUES
('Mathematics', '2025', 'A-Level', 'past-papers/math-2025.pdf', 'Mathematics_S6_2025.pdf', 1),
('Physics', '2025', 'A-Level', 'past-papers/physics-2025.pdf', 'Physics_S6_2025.pdf', 1),
('Biology', '2024', 'A-Level', 'past-papers/biology-2024.pdf', 'Biology_S6_2024.pdf', 1),
('Chemistry', '2024', 'A-Level', 'past-papers/chemistry-2024.pdf', 'Chemistry_S6_2024.pdf', 1),
('Mathematics', '2024', 'A-Level', 'past-papers/math-2024.pdf', 'Mathematics_S6_2024.pdf', 1),
('English', '2025', 'A-Level', 'past-papers/english-2025.pdf', 'English_S6_2025.pdf', 1);

-- Time Slots
INSERT INTO time_slots (day_of_week, start_time, end_time, is_active) VALUES
('Monday', '09:00', '10:00', true),
('Monday', '14:00', '15:00', true),
('Wednesday', '10:00', '11:00', true),
('Thursday', '13:00', '14:00', true),
('Friday', '09:00', '10:00', true);
