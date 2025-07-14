# BCS Lost \& Found

A modern, responsive web application for managing lost and found items at Brentwood College School. Built with React, TypeScript, and Firebase, featuring Google authentication and real-time data management.

## 🚀 Features

- **Google Authentication**: Secure login using Brentwood College School accounts
- **Item Management**: Post, search, and manage lost and found items
- **Admin Dashboard**: Administrative controls for item approval and management
- **Real-time Updates**: Live data synchronization using Firebase Firestore
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Search \& Filter**: Advanced search functionality to find items quickly
- **Image Upload**: Support for item photos to help with identification
- **Statistics Dashboard**: Overview of lost/found items and trends


## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Material-UI (MUI) components
- **Backend**: Firebase (Firestore, Authentication, Storage, Hosting)
- **Build Tool**: Create React App
- **CI/CD**: GitHub Actions with Firebase Hosting
- **Code Quality**: ESLint, Prettier


## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- npm or yarn package manager
- Firebase account and project
- Google Cloud Console project (for authentication)


## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/bcs-lost-and-found.git
cd bcs-lost-and-found
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Firebase configuration**
    - Create a `.env` file in the root directory
    - Add your Firebase configuration:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. **Start the development server**

```bash
npm start
```


The application will open at `http://localhost:3000`.

## 🚀 Deployment

This project is configured for automatic deployment using GitHub Actions and Firebase Hosting.

### Automatic Deployment (Recommended)

1. **Push to main branch** - Automatically deploys to production
2. **Create pull request** - Automatically creates preview deployment

### Manual Deployment

```bash
npm run build
firebase deploy --only hosting
```


## 📁 Project Structure

```
src/
├── components/         # React components
│   ├── AdminPage.tsx   # Admin dashboard
│   ├── Header.tsx      # Navigation header
│   ├── Homepage.tsx    # Main homepage
│   ├── ItemForm.tsx    # Item submission form
│   ├── ItemCard.tsx    # Item Cards view
│   └── NotificationDialog.tsx # Custom Feedbacks
├── firebase/           # Firebase configuration
├── types/              # TypeScript type definitions
├── hooks/              # Hook functions
└── App.tsx            # Main application component
```


## 🔐 Authentication

The application uses Firebase Authentication with Google Sign-In, restricted to Brentwood College School accounts. Users must sign in with their school Google account to access the platform.

## 💾 Database Schema

The application uses Firestore with the following main collections:

- **items**: Lost and found items
- **users**: User profiles and permissions
- **categories**: Item categories for organization


## 🎨 Styling

The project uses Material-UI for consistent, modern styling with:

- Responsive grid system
- Custom theme configuration
- Consistent color palette
- Mobile-first design approach


## 🧪 Code Quality

- **ESLint**: Configured for React and TypeScript
- **Prettier**: Automatic code formatting
- **TypeScript**: Type safety and better developer experience


## 📝 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
