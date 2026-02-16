# Database Schema Documentation

This document outlines the data model for the Boutique Staffing Portal, based on the SQLAlchemy models.

## **1. Users Table (`users`)**
Stores all system users, including Candidates, Clients, and Admins.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | PK | Unique identifier |
| `email` | String | No | - | Unique email address |
| `hashed_password` | String | No | - | Bcrypt hashed password |
| `is_active` | Boolean | No | `True` | Account status |
| `role` | Enum | No | `candidate` | `admin`, `client`, or `candidate` |
| `created_at` | DateTime | No | `now()` | Timestamp of creation (inherited from Base) |
| `updated_at` | DateTime | No | `now()` | Timestamp of last update (inherited from Base) |

### **Candidate Profile Fields**
| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `first_name` | String | Yes | Candidate's first name |
| `middle_initial` | String | Yes | Middle initial |
| `last_name` | String | Yes | Candidate's last name |
| `phone_number` | String | Yes | Contact number |
| `city` | String | Yes | Current city |
| `state` | String | Yes | State abbreviation (e.g., CA, NY) |
| `years_of_experience` | Integer | Yes | Total professional experience |
| `work_permit_type` | String | Yes | e.g., US Citizen, Green Card, H1B |
| `linkedin_url` | String | Yes | Profile URL |

### **Client Profile Fields**
| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `company_name` | String | Yes | Name of the hiring company |
| `designation` | String | Yes | Job title of the client user |

### **Relationships**
- **Jobs**: One-to-Many (A client can post multiple jobs)
- **Applications**: One-to-Many (A candidate can have multiple applications)

---

## **2. Jobs Table (`jobs`)**
Stores job listings posted by Clients.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | PK | Unique identifier |
| `title` | String | No | - | Job Title |
| `description` | String | No | - | Detailed job description |
| `requirements` | String | Yes | - | Mandatory skills/qualifications |
| `nice_to_have_requirements`| String | Yes | - | Optional skills |
| `location` | String | Yes | - | Job location (Remote, City, etc.) |
| `salary_range` | String | Yes | - | e.g., "$100k - $120k" |
| `is_active` | Boolean | No | `True` | If the job is currently open |
| `owner_id` | Integer | No | FK | Links to `users.id` (Client) |

### **Relationships**
- **Owner**: Many-to-One (Belongs to a specific Client User)
- **Applications**: One-to-Many (A job receives multiple applications)

---

## **3. Applications Table (`applications`)**
Links Candidates to Jobs and stores screening data.

| Column | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | PK | Unique identifier |
| `user_id` | Integer | No | FK | Links to `users.id` (Candidate) |
| `job_id` | Integer | No | FK | Links to `jobs.id` |
| `status` | Enum | No | `applied` | `applied`, `interviewing`, `rejected`, `hired` |
| `resume_path` | String | Yes | - | Path to stored PDF file (e.g., in G: Drive) |
| `ai_score` | Integer | Yes | - | 0-100 match score |
| `ai_analysis` | Text | Yes | - | JSON string of AI evaluation details |
| `is_reviewed` | Boolean | No | `False` | Has the client reviewed this? |

### **Relationships**
- **User**: Many-to-One (Belongs to a Candidate)
- **Job**: Many-to-One (Belongs to a Job Listing)

---

## **Global Constraints**
- **Unique Constraint (`uq_user_email_role`)**: An email must be unique for a specific role (e.g., one email can be used for both a Candidate account and a Client account, but not two Candidate accounts).
