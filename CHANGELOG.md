# Changelog

All notable changes to TreePath will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Hosted backend adapter implementation
- Enhanced analytics features
- Additional visualization options

## [0.0.1] - 2025-01-XX

### Added
- Initial release of TreePath
- Study Creator with tree structure editor
- Task editor with multiple expected paths support
- Settings editor with markdown support
- Participant view for completing tree tests
- Study Analyzer with comprehensive data visualization
- Multiple storage adapters:
  - Custom API adapter (Bring Your Own Backend)
  - Google Sheets adapter (Apps Script method)
  - Local Download adapter (Excel/CSV export)
- Storage configuration UI
- Global settings for Custom API configuration
- Study sync functionality from Custom API
- Intro/welcome screen
- Help page with setup guides
- Landing/dashboard page
- Data export in analyzer-compatible format
- Study configuration JSON export/import
- Cross-device study loading support
- Study status management (Draft/Published/Closed)
- Interactive tree navigation with breadcrumbs
- Task progression system with confidence ratings
- Comprehensive analytics including:
  - Path analysis
  - Success rates
  - Confidence metrics
  - Time tracking
  - Sankey diagrams
  - Pie charts
- Responsive design for mobile and desktop
- Modern UI with Tailwind CSS
- TypeScript for type safety

### Technical Details
- React 19 with TypeScript
- Vite build system
- React Router for navigation
- D3.js and Recharts for visualizations
- Radix UI components
- Tailwind CSS for styling

[Unreleased]: https://github.com/minw147/tree_test_analyzer/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/minw147/tree_test_analyzer/releases/tag/v0.0.1

