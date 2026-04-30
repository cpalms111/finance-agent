# Finance Agent TODO

## Core Features

### Phase 1: Database & Authentication
- [x] Design and implement database schema (expenses, budgets, goals, income records)
- [x] Set up Manus OAuth integration (already configured in template)
- [x] Create user context and protected procedures

### Phase 2: Expense Tracking
- [x] Add expense creation (amount, category, date, description)
- [x] Add expense editing and deletion
- [x] Build expense list with filtering (date range, category)
- [x] Create expense API procedures

### Phase 3: Dashboard & Visualization
- [x] Build expense dashboard with charts (spending by category, monthly trends)
- [x] Implement key financial metrics display
- [x] Add category breakdown visualization
- [x] Create monthly spending trends chart

### Phase 4: Budget Management
- [x] Create budget setup UI (set limits per category)
- [x] Build budget tracking visualization
- [x] Add progress indicators for budget limits
- [x] Implement budget vs actual spending comparison

### Phase 5: AI Financial Advisor
- [x] Build decision advisor UI (text input for financial decisions)
- [x] Integrate LLM for financial decision analysis
- [x] Create reasoning engine for wise/unwise verdicts
- [x] Display analysis results with explanations

### Phase 6: Savings Goals & Roadmap
- [x] Create savings goal setup UI
- [x] Build goal progress tracking (fixed with proper save button)
- [x] Implement personalized roadmap generator (based on actual expenses)
- [x] Add savings vs spending overview
- [x] Create SavingsRoadmap page with milestone planning

### Phase 7: Income Management
- [x] Create income logging UI (for variable income)
- [x] Build income organizer for gig workers
- [x] Implement practical guidance for income fluctuations
- [x] Add income tracking and analysis

### Phase 8: Automated Monthly Summaries
- [x] Design monthly summary generation logic
- [x] Integrate LLM for summary creation
- [x] Set up on-demand summary generation (can be triggered manually or via scheduled task)
- [x] Create summary storage and retrieval

### Phase 9: Data Export
- [x] Implement CSV export for expenses
- [x] Implement HTML report export for reports
- [x] Build export UI with format selection
- [x] Add financial report generation

### Phase 10: UI/UX Polish
- [x] Design elegant, premium visual style
- [x] Implement responsive layouts
- [x] Add loading states and error handling
- [x] Optimize performance and accessibility
- [x] Test all features end-to-end

## Implementation Checklist

- [x] Database schema created and migrations applied
- [x] Manus OAuth configured and working
- [x] Expense CRUD operations complete
- [x] Dashboard with visualizations functional
- [x] Budget tracking implemented
- [x] AI advisor integrated and tested
- [x] Savings goals and roadmap working
- [x] Income organizer functional
- [x] Monthly summaries with AI analysis (on-demand generation)
- [x] Export features (CSV/HTML) working
- [x] UI polished and responsive with premium theme
- [x] All tests passing (12/12 tests)
- [x] Ready for deployment


## Bank Statement Import Feature (NEW)

### Database
- [x] Add merchantRules table to schema
- [x] Generate and apply database migration

### Backend API
- [x] Add tRPC procedure to parse CSV and extract transactions
- [x] Add tRPC procedure to get saved merchant rules
- [x] Add tRPC procedure to save merchant rule (when user changes category)
- [x] Add tRPC procedure to categorize transactions with AI (with merchant rules applied first)
- [x] Add tRPC procedure to import transactions to expenses table

### Frontend - Import Page
- [x] Create BankImport.tsx page component
- [x] Add "Import Bank Statement" button to Expenses page
- [x] Build CSV upload area (drag & drop + file browser)
- [x] Accept Wells Fargo and generic CSV formats

### Frontend - Review Screen
- [x] Display review table with Date, Description, Amount, Category
- [x] Add category dropdown for each transaction (pre-filled with AI suggestion)
- [x] Add "Select All" / "Deselect All" checkboxes
- [x] Add checkbox for each transaction to include/exclude from import
- [x] Show transaction count and import button

### Frontend - Integration
- [x] Call AI to categorize transactions
- [x] Apply saved merchant rules before AI categorization
- [x] Handle category changes and save as merchant rules
- [x] Import selected transactions to database
- [x] Redirect to Expenses page after successful import

### Testing
- [x] Test CSV parsing with Wells Fargo format
- [x] Test AI categorization accuracy
- [x] Test merchant rule saving and application
- [x] Test transaction import and database updates (16/16 tests passing)


## Multi-Account System (NEW)

### Phase 8: Database & Account Management (COMPLETED)
- [x] Create accounts table with id, userId, name, type, institution, color
- [x] Generate and apply database migration
- [x] Add account CRUD query functions to db.ts
- [x] Add account tRPC procedures (list, create, update, delete)
- [x] Create Accounts management page with account cards
- [x] Add colored account cards with edit/delete buttons
- [x] Show setup prompt when no accounts exist

### Phase 9: Link Accounts to Transactions
- [x] Add accountId field to expenses table
- [x] Add accountId field to income table
- [x] Generate and apply migrations
- [x] Update expense form to include account dropdown
- [x] Update income form to include account dropdown
- [x] Update expense/income create procedures to accept accountId
- [x] Update database queries to handle accountId

### Phase 10: Account Filtering
- [x] Add account filter dropdown to Expenses page
- [x] Add account filter dropdown to Income page
- [x] Add account filter dropdown to Dashboard
- [x] Update queries to filter by accountId
- [x] Show "All Accounts" option in filters

### Phase 11: Dashboard & Bank Import Updates
- [x] Add Dashboard account summary section
- [x] Show each account as card with income/expenses/balance
- [x] Update bank import flow to ask for account selection
- [x] Link imported transactions to selected account
- [x] Update import procedures to set accountId

### Phase 12: Testing & Deployment
- [x] Write tests for account CRUD operations
- [x] Write tests for account filtering
- [x] Write tests for multi-account transactions
- [x] Verify all features end-to-end
- [x] Commit and push to GitHub


## Multi-Account System (Incremental Implementation)

### Phase 1: Accounts Table & Management Page
- [x] Create accounts table in database schema (id, userId, name, type, institution, color)
- [x] Generate database migration for accounts table
- [x] Add account query functions to db.ts (list, create, update, delete)
- [x] Add account tRPC procedures (list, create, update, delete)
- [x] Create Accounts management page with colored account cards
- [x] Add edit and delete buttons to account cards
- [x] Show setup prompt when no accounts exist
- [x] Test accounts page works independently (no integration yet)
- [x] All 14 tests passing for account CRUD operations

### Phase 2: Add accountId to Transactions (Backward Compatible)
- [x] Add optional accountId field to expenses table
- [x] Add optional accountId field to income table
- [x] Generate database migrations
- [x] Update createExpense function to accept optional accountId
- [x] Update createIncomeRecord function to accept optional accountId
- [x] Verify existing expense/income creation still works without accountId

### Phase 3: Update Transaction Forms
- [x] Update expense form to include account dropdown
- [x] Update income form to include account dropdown
- [x] Make account selection optional in forms (backward compatible)
- [x] Update expense/income procedures to handle accountId
- [x] Test that new transactions are created with accountId

### Phase 4: Add Account Filters
- [x] Add account filter dropdown to Expenses page
- [x] Add account filter dropdown to Income page
- [x] Add account filter dropdown to Dashboard (prepared for Phase 5)
- [x] Update queries to filter by accountId when selected
- [x] Show "All Accounts" option in filters
- [x] Test filtering works correctly

### Phase 5: Bank Import Integration
- [x] Update bank import flow to ask for account selection
- [x] Link imported transactions to selected account
- [x] Update import procedures to set accountId
- [x] Test CSV import with account selection
- [x] Add no-accounts empty state to BankImport

### Phase 6: Dashboard Account Summary
- [x] Add Dashboard account summary section
- [x] Show each account as card with income/expenses/balance
- [x] Display account color and type
- [x] Test summary displays correctly

### Phase 7: Testing & Deployment
- [x] Write tests for account CRUD operations (14 tests in accounts.test.ts)
- [x] Write tests for account filtering (9 tests in accountFiltering.test.ts)
- [x] Write tests for multi-account transactions (7 tests in multiAccount.test.ts)
- [x] Verify all existing features still work (51 tests passing)
- [x] Commit and push to GitHub
