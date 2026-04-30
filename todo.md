# Finance Agent - TODO

## URGENT: Wells Fargo CSV Import Fix

### Phase 1: Fix Wells Fargo CSV Parser
- [x] Parse exact Wells Fargo format: DATE, DESCRIPTION, AMOUNT, CHECK #, STATUS
- [x] Handle MM/DD/YYYY date format
- [x] Skip rows where STATUS != 'Posted'
- [x] Correctly identify income (positive amounts) vs expenses (negative amounts)

### Phase 2: Implement Transaction Type Detection
- [x] Categorize 'ONLINE TRANSFER' as 'Transfer' category
- [x] Detect 'Instant Pmt from SQUARE' as business income
- [x] Route positive amounts to income records
- [x] Route negative amounts to expense records
- [x] Handle mixed income/expense imports in single CSV

### Phase 3: Fix Server Error Handling
- [x] Fix HTML error response issue in categorizeTransactions
- [x] Add proper try-catch for all API errors
- [x] Return valid JSON error responses
- [x] Log errors for debugging

### Phase 4: Improve UI Error Display
- [x] Show error messages on import screen
- [x] Display specific error details to user
- [x] Add retry button for failed imports
- [x] Clear errors when user retries

### Phase 5: Testing & Deployment
- [x] Test with real Wells Fargo CSV format
- [x] Test income detection (positive amounts)
- [x] Test expense detection (negative amounts)
- [x] Test transfer categorization
- [x] Test SQUARE income detection
- [x] Test status filtering
- [x] Verify all 51 tests still pass
- [x] Commit and push to GitHub
