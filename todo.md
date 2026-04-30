# Finance Agent - TODO

## PDF Bank Statement Import Feature

### Phase 1: Add PDF Upload Support to Import UI
- [x] Update BankImport.tsx to accept both CSV and PDF files
- [x] Add file type validation for PDF (.pdf)
- [x] Display upload area that accepts both CSV and PDF
- [x] Show file type indicator in upload UI

### Phase 2: Create PDF Extraction Utility with AI
- [x] Create server-side PDF extraction procedure
- [x] Use AI to read Wells Fargo PDF and extract transactions
- [x] Extract date, description, and amount from PDF
- [x] Return transactions in same format as CSV parser
- [x] Handle multi-page PDFs
- [x] Add error handling for invalid/corrupted PDFs

### Phase 3: Integrate PDF Parser into Import Flow
- [x] Detect file type (CSV vs PDF) in handleFileUpload
- [x] Route to appropriate parser (CSV or PDF)
- [x] Ensure both parsers return same transaction format
- [x] Process PDF transactions through same review screen
- [x] Apply same categorization logic to PDF imports

### Phase 4: Test PDF Import End-to-End
- [x] Test PDF upload and parsing
- [x] Verify transaction extraction accuracy
- [x] Test review screen with PDF transactions
- [x] Test categorization of PDF transactions
- [x] Verify all 51 tests still pass
- [x] Test error handling for invalid PDFs

### Phase 5: Commit and Deploy
- [x] Commit PDF import feature to GitHub
- [x] Push to main branch
- [x] Save checkpoint
