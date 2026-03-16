# Voices Rising — Writing for Human Rights Among Teens in India

## 1. Project Description
Voices Rising is a platform dedicated to amplifying the voices of teenagers across India. It provides a safe, inspiring space for teens to write, reflect, and advocate for human rights issues that matter to them. The platform acts as a spotlight for featured articles and allows readers to browse through all published stories.

## 2. Features
- **Home Page**: Spotlight overview with featured articles and clean inspirational design.
- **All Articles Page**: Browse all published articles with titles, authors, dates, and previews.
- **About the Author Page**: Biography, mission statement, and contact details.
- **Admin Dashboard**: Create, edit, delete, and publish articles.
- **Local Storage**: Articles persist between page refreshes using browser `localStorage`.
- **Responsive Design**: Modern, minimal, and readable layout that works on all devices.

## 3. Installation Instructions
1. Ensure you have Node.js installed (v18 or higher recommended).
2. Extract the `.zip` archive.
3. Open a terminal and navigate to the project directory.
4. Run `npm install` to install all required dependencies.

## 4. How to Run Locally
1. Run `npm run dev` to start the development server.
2. Open your browser and navigate to `http://localhost:3000` (or the port specified in your terminal).

## 5. Login Credentials
**Admin Login**
- Username: `admin`
- Password: `admin123`
- *Access: Can create, edit, delete, and publish articles via the Admin Dashboard.*

**User Login**
- Username: `reader`
- Password: `reader123`
- *Access: Redirects to the articles view to read and browse published content.*

## 6. Project Structure Explanation
- `src/`: Contains the React application source code.
  - `components/`: Reusable UI components like `Navbar` and `Footer`.
  - `pages/`: Page components (`Home`, `Articles`, `About`, `Login`, `Admin`).
  - `lib/`: Utility functions and `localStorage` logic (`storage.ts`).
  - `App.tsx`: Main application router.
  - `main.tsx`: Application entry point.
  - `index.css`: Global styles and Tailwind CSS configuration.
- `public/`: Static assets.
- `package.json`: Project dependencies and scripts.
- `vite.config.ts`: Vite bundler configuration.
