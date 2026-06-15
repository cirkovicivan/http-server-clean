# HTTP Server

A lightweight, production-ready HTTP server built with Node.js. This project demonstrates core server functionality including routing, request handling, and middleware support.

## Description

HTTP Server is a minimal yet functional web server implementation that showcases fundamental HTTP protocol concepts. It provides a clean API for handling HTTP requests, managing routes, and serving responses efficiently.

## Features

- 🚀 **Fast & Lightweight** - Minimal dependencies for quick startup and low resource usage
- 🛣️ **Flexible Routing** - Easy-to-use route handling with support for common HTTP methods
- 📝 **Request Processing** - Full HTTP request parsing and response generation
- 🧪 **Well Tested** - Comprehensive test suite with Mocha and Chai
- 🔧 **Development Tools** - Hot-reload support with Nodemon for smooth development experience
- 📦 **Modular Design** - Clean, maintainable code structure

## Installation

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/cirkovicivan/http-server.git
   cd http-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

   The server will start in development mode with hot-reload enabled.

## Usage

### Starting the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
node app/main.js
```

### Running Tests

Execute the test suite to verify functionality:
```bash
npm test
```

### Example Requests

Once the server is running, you can test it with curl or any HTTP client:

```bash
# GET request
curl http://localhost:8000/api/users

# POST request
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime environment |
| **Mocha** | Testing framework |
| **Chai** | Assertion library |
| **Nodemon** | Development auto-reload utility |

## Project Structure

```
http-server/
├── app/
│   └── main.js           # Application entry point
├── test/                 # Test files
├── package.json          # Project dependencies
├── README.md             # This file
└── .gitignore            # Git ignore rules
```

## License

This project is licensed under the MIT License - see below for details.

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for bugs and feature requests.

## Support

For questions or issues, please open a GitHub issue on the [repository](https://github.com/cirkovicivan/http-server).
