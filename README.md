# TreePath

> The **private**, **self-hosted** tree testing tool for modern UX research.

TreePath is an open-source application for conducting tree testing studies to evaluate information architecture and navigation structures. It provides a complete solution for creating studies, collecting participant data, and analyzing results—all while keeping your data private and secure.

![TreePath](https://img.shields.io/badge/license-MIT-blue.svg)
![TreePath](https://img.shields.io/badge/version-0.0.1-green.svg)

🌐 **Live Demo**: [https://tree-test-suite.vercel.app/](https://tree-test-suite.vercel.app/)

## ✨ Features

- **🔒 High Data Privacy** - Your data stays private and secure
- **🖥️ Self-Hosted Backend** - Use your own backend infrastructure
- **🎁 Open Source** - Free and open-source
- **📊 Advanced Data Visualization** - Powerful analytics and insights
- **🤖 AI-Ready Summaries** - Formatted summaries for AI analysis

### Core Capabilities

- **Study Creator**: Build tree structures, define tasks, and configure study settings
- **Participant View**: Clean, intuitive interface for participants to complete tests
- **Data Analysis**: Comprehensive analytics with visualizations including:
  - Path analysis and success rates
  - Task completion metrics
  - Confidence ratings
  - Time tracking
  - Sankey diagrams for navigation flows
- **Flexible Storage**: Multiple storage options to fit your needs:
  - **Custom API**: Bring your own backend (free)
  - **Google Sheets**: Use Google Sheets as your database (free)
  - **Local Download**: Export results as Excel/CSV files

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/minw147/tree_test_analyzer.git
cd tree_test_analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to deploy to any static hosting service.

## 📖 Usage Guide

### Creating a Study

1. Navigate to the **Creator** page (`/create`)
2. **Build your tree structure** using the Tree Editor
3. **Define tasks** that participants will complete
4. **Configure settings** including welcome messages and instructions
5. **Set up storage** - Choose how you want to collect participant data
6. **Publish your study** to generate a shareable link

### Collecting Data

1. Share the participant link with your test participants
2. Participants complete the tree test through the participant view
3. Results are automatically saved to your configured storage backend

### Analyzing Results

1. Navigate to the **Analyzer** page (`/analyze`)
2. Upload your results file (Excel/CSV) or load from your storage backend
3. View comprehensive analytics including:
   - Success rates by task
   - Navigation paths
   - Confidence ratings
   - Time metrics
   - Visual flow diagrams

## 🔧 Storage Options

### Custom API (Bring Your Own Backend)

Use your own backend API to store study data. Perfect for organizations that need full control over their data.

- Configure your API endpoint in Settings
- Supports standard REST API endpoints
- Works with any backend (Node.js, Python, etc.)

### Google Sheets

Use Google Sheets as your database with the included Apps Script template.

- No backend required
- Easy setup with provided Apps Script
- Access data directly in Google Sheets

### Local Download

Export participant results as Excel/CSV files for offline analysis.

- Perfect for testing and development
- Participants download their results
- Manual collection and analysis

## 🛠️ Development

### Project Structure

```
src/
├── components/     # React components
│   ├── creator/   # Study creation components
│   ├── dashboard/ # Analysis and visualization components
│   ├── participant/ # Participant view components
│   └── ui/        # Reusable UI components
├── lib/           # Core libraries
│   ├── storage/   # Storage adapters
│   └── types/     # TypeScript types
└── pages/         # Page components
```

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **D3.js** - Data visualization
- **Recharts** - Chart library

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with modern web technologies and designed for privacy-first UX research.

## 📧 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**TreePath** - Making tree testing accessible, private, and powerful.
