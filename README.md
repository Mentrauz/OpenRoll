# Payroll Management System

A comprehensive payroll management solution built with Next.js, designed to streamline HR and payroll operations for businesses. This system provides complete employee management, salary processing, compliance exports, and detailed reporting capabilities. (Just a DEMO)

## 🚀 Features

### Core Functionality
- **Multi-level Authentication**: Secure login system with role-based access control
- **Employee Management**: Complete employee lifecycle from registration to retirement
- **Salary Processing**: Automated salary calculations with earnings, deductions, and compliance
- **Attendance Tracking**: Real-time attendance monitoring with quick attendance features
- **Financial Compliance**: EPF, ESIC, LWF calculations and export capabilities

### Dashboard & Analytics
- **Interactive Dashboard**: Revenue tracking, subscriber metrics, and performance analytics
- **Real-time Reports**: Live data visualization with charts and graphs
- **Export Capabilities**: Generate Excel, PDF reports for various compliance requirements
- **Invoice Generation**: Automated invoice creation and management

### Administrative Features
- **User Management**: Role-based permissions and user administration
- **Bulk Operations**: Mass data import/export functionality
- **Approval Workflows**: Pending changes and approval management
- **Unit Management**: Multi-unit organization support

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 18** - UI library with modern hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### Backend & Database
- **Next.js API Routes** - Server-side API endpoints
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **NextAuth.js** - Authentication framework

### Libraries & Tools
- **@react-pdf/renderer** - PDF generation
- **xlsx-js-style** - Excel file processing
- **Chart.js/Recharts** - Data visualization
- **React Hook Form + Zod** - Form validation
- **React Dropzone** - File uploads
- **Lordicon** - Animated icons

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **MongoDB** 6.x or higher
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

1. **Clone the repository**
   ```Terminal
   git clone <repository-url>
   cd payroll-uid
   ```

2. **Install dependencies**
   ```Terminal
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/payroll (For local hosting of database)
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3001
   SUREPASS_API_KEY=your-api-key (For bank and aadhar verification)
   ```

4. **Database Setup**
   Ensure MongoDB is running and accessible at the configured URI.

5. **Development Server**
   ```Terminal
   npm run dev
   ```
   The application will be available at `http://localhost:3001`

## 📁 Project Structure

```
payroll-uid/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard and reports
│   ├── (main)/            # Main application pages
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
├── models/                # MongoDB schemas
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── styles/                # Additional styling
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run reset-passwords-interactive` - Interactive password reset

## 🔐 Authentication & Security

The system implements a comprehensive security model:

- **Session-based Authentication** using NextAuth.js
- **Role-based Access Control** (Admin, User, Employee roles)
- **Permission-based UI** with dynamic menu filtering
- **Secure API endpoints** with proper validation
- **Password hashing** using bcrypt

## 💼 Key Modules

### Employee Management
- Employee registration and profile management
- Attendance tracking and reporting
- Salary slip generation
- Document verification (Aadhaar, Bank details)

### Payroll Processing
- Automated salary calculations
- Earnings and deductions management
- Tax calculations (PT, LWF)
- Compliance exports (EPF, ESIC)

### Financial Operations
- Books management and accounting
- Invoice generation and tracking
- Bulk upload capabilities
- Financial year management

### Reporting & Analytics
- Salary reports with filtering
- Attendance analytics
- Revenue and performance metrics
- Export functionality for external systems

## 🔄 API Endpoints

The system provides RESTful APIs for:

- `/api/auth/*` - Authentication endpoints
- `/api/employees/*` - Employee management
- `/api/payroll/*` - Salary processing
- `/api/attendance/*` - Attendance tracking
- `/api/exports/*` - Data export functionality
- `/api/admin/*` - Administrative operations

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark/Light Theme** - System preference detection
- **Animated Icons** - Lordicon integration for enhanced UX
- **Progressive Web App** - PWA capabilities with service worker
- **Modern Components** - Custom component library with Radix UI

## 📊 Data Models

### Core Entities
- **Employee**: Personal details, salary information, compliance data
- **Unit**: Organizational units with specific configurations
- **Attendance**: Daily attendance records
- **Salary**: Monthly salary calculations and breakdowns
- **Financial Year**: Accounting period management

## 🔧 Configuration

### Unit Configuration
Each unit can be configured with:
- Working days per month
- LWF rates and limits
- Regional compliance settings
- Tax calculation parameters

### Salary Components
- Basic Salary
- HRA (House Rent Allowance)
- Conveyance Allowance
- Other Allowances
- Deductions (PF, ESIC, LWF, PT)

## 🚀 Deployment

1. **Build the application**
   ```Terminal
   npm run build
   ```

2. **Start production server**
   ```Terminal
   npm start
   ```

3. **Environment Variables**
   Use your own Atlas key or port it to a different database.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions, please contact me ^~^

---

**Built with ❤️ using Next.js and modern web technologies**

