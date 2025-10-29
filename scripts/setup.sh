#!/bin/bash

echo "🚀 Setting up Transbantu HR Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL and create the database."
    echo "   You can install PostgreSQL using:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt-get install postgresql"
    echo ""
    echo "   Then create the database:"
    echo "   createdb transbantu_hr"
    echo "   createuser hr_admin"
    echo "   psql -c \"ALTER USER hr_admin WITH PASSWORD 'secure_password';\""
    echo "   psql -c \"GRANT ALL PRIVILEGES ON DATABASE transbantu_hr TO hr_admin;\""
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd backend && npx prisma generate && cd ..

# Run database migrations (if database is available)
echo "🗄️  Setting up database..."
cd backend
if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "✅ Database schema created successfully"
    
    # Seed the database
    echo "🌱 Seeding database with initial data..."
    if npm run db:seed 2>/dev/null; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Database seeding failed. You can run 'npm run db:seed' later."
    fi
else
    echo "⚠️  Database setup failed. Please ensure PostgreSQL is running and the database exists."
    echo "   You can set up the database later by running:"
    echo "   cd backend && npx prisma db push && npm run db:seed"
fi
cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "🔧 To start the development servers:"
echo "   npm run dev"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "🔑 Default login credentials:"
echo "   Admin: admin@transbantu.com / admin123"
echo "   HR Manager: hr@transbantu.com / hr123"
echo "   Employee: john.smith@transbantu.com / employee123"