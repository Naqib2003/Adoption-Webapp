# Family Adoption & Senior Care Portal 👨‍👩‍👧‍👦👴

A comprehensive web application designed to connect families with children and senior citizens in need of a loving home or care. This platform streamlines the adoption and care application process while incorporating smart matching, needs-based wishlists, and post-placement tracking.

Built for the CSE370 Project.

---

## 🎥 Video Demonstration

*(When your video is uploaded, replace `YOUR_VIDEO_ID` in both links below with the actual 11-character ID from your YouTube URL!)*

[![Watch the Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://youtu.be/YOUR_VIDEO_ID)

*Click the image above to watch the full system walkthrough on YouTube.*

---

## 📸 Application Gallery

### Core Navigation & Access
| Landing Page | Login Portal |
| :---: | :---: |
| ![Landing Page](./project-screenshots/landing-page.png) <br> *A welcoming UI for families and donors.* | ![Login Page](./project-screenshots/login-page.png) <br> *Secure access for all user roles.* |

### User Dashboards
| Adopter Page | Guardian Page |
| :---: | :---: |
| ![Adopter View](./project-screenshots/adopter-page.png) <br> *Dashboard for prospective families.* | ![Guardian View](./project-screenshots/Guardian-page.png) <br> *Management portal for current guardians.* |

### Administrative & Legal Verification
| Moderator Page | Lawyer Page | Police Page |
| :---: | :---: | :---: |
| ![Moderator View](./project-screenshots/moderator-page.png) <br> *Platform moderation and tracking.* | ![Lawyer View](./project-screenshots/Lawyer-page.png) <br> *Legal review and application processing.* | ![Police View](./project-screenshots/police-page.png) <br> *Background checks and clearance.* |

---

## 🚀 Key Features & Team Contributions

Our platform includes several distinct modules developed collaboratively:

*   **Family Registration & Profile Management** *(Naqib)*: Families can create and manage detailed profiles (personal info, housing, preferences) to establish eligibility.
*   **Browse Children & Senior Profiles** *(Ahnaf)*: Verified users can easily navigate profiles of available children, teenagers, and senior citizens.
*   **Adoption & Senior Care Application** *(Naqib)*: A seamless application portal for families to apply for adoption, senior care, or both.
*   **Profile Verification** *(Ismail)*: Secure validation process managed by registered Legal Entities (Lawyers and Police) to ensure platform safety and authenticity.
*   🌟 **Smart Family Matching System** *(Ahnaf - Unique Feature)*: An algorithmic recommendation engine that pairs families with suitable children/seniors based on compatibility factors.
*   **Donation & Sponsorship Portal** *(Naqib)*: Allows users who cannot adopt to support the cause via financial donations or sponsoring essential needs.
*   🌟 **Needs-Based Wishlist** *(Ismail - Unique Feature)*: A personalized registry for each child and senior (e.g., school supplies, mobility aids). Donors can transparently fund specific items.
*   **Application Progress Tracker** *(Ahnaf)*: Applicants have full visibility into their journey—from initial submission to final placement.
*   **Life-Time Tracking** *(Ismail)*: Post-adoption portal for moderators to schedule follow-ups and monitor the long-term well-being of adoptees.

---

## 🛠️ Technology Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MySQL
*   **Frontend:** HTML, CSS, JavaScript
*   **Authentication & Sessions:** Express-Session

---

## 💻 Local Setup Instructions

To run this project on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/cse370-project.git
   cd cse370-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   * Create a `.env` file in the root directory.
   * Add your database credentials and session secrets:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_NAME=adoption_db
     SESSION_SECRET=your_super_secret_key
     PORT=3000
     ```

4. **Initialize the Database:**
   * Run the provided SQL scripts (e.g., `schema.sql`) in your local MySQL environment to create the necessary tables.

5. **Start the server:**
   ```bash
   node app.js
   ```
   *The app will be running at `http://localhost:3000`*
