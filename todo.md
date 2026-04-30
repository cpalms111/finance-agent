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
- [ ] Design monthly summary generation logic
- [ ] Integrate LLM for summary creation
- [ ] Set up scheduled task for end-of-month analysis
- [ ] Create summary storage and retrieval

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
- [ ] Monthly summaries automated (optional future enhancement)
- [x] Export features (CSV/HTML) working
- [x] UI polished and responsive with premium theme
- [x] All tests passing (12/12 tests)
- [x] Ready for deployment


## Bank Statement Import Feature (NEW)

### Database
- [ ] Add merchantRules table to schema
- [ ] Generate and apply database migration

### Backend API
- [ ] Add tRPC procedure to parse CSV and extract transactions
- [ ] Add tRPC procedure to get saved merchant rules
- [ ] Add tRPC procedure to save merchant rule (when user changes category)
- [ ] Add tRPC procedure to categorize transactions with AI (with merchant rules applied first)
- [ ] Add tRPC procedure to import transactions to expenses table

### Frontend - Import Page
- [ ] Create BankImport.tsx page component
- [ ] Add "Import Bank Statement" button to Expenses page
- [ ] Build CSV upload area (drag & drop + file browser)
- [ ] Accept Wells Fargo and generic CSV formats

### Frontend - Review Screen
- [ ] Display review table with Date, Description, Amount, Category
- [ ] Add category dropdown for each transaction (pre-filled with AI suggestion)
- [ ] Add "Select All" / "Deselect All" checkboxes
- [ ] Add checkbox for each transaction to include/exclude from import
- [ ] Show transaction count and import button

### Frontend - Integration
- [ ] Call AI to categorize transactions
- [ ] Apply saved merchant rules before AI categorization
- [ ] Handle category changes and save as merchant rules
- [ ] Import selected transactions to database
- [ ] Redirect to Expenses page after successful import

### Testing
- [ ] Test CSV parsing with Wells Fargo format
- [ ] Test AI categorization accuracy
- [ ] Test merchant rule saving and application
- [ ] Test transaction import and database updates
