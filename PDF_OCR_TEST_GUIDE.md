# Quick Test Guide for PDF Upload & OCR

## Prerequisites
- The web app should be running: `pnpm dev` (from apps/web)
- The backend should be running: `pnpm dev` (from apps/backend)

## Test Scenarios

### ✅ Test 1: Upload Image File (Regression Test)
1. Navigate to the receipts page
2. Click "Add Receipt" or similar button
3. Upload a PNG/JPG receipt image
4. Click "Extract Data from Image (OCR)"
5. **Expected**: Text is extracted and form fields are auto-filled
6. **Success**: If OCR completes and data appears in form fields

### ✅ Test 2: Upload Single-Page PDF
1. Navigate to the receipts page
2. Click "Add Receipt"
3. Upload a PDF receipt (single page)
4. **Expected**: PDF icon placeholder appears
5. Click "Extract Data from Image (OCR)"
6. **Expected**: 
   - Progress bar shows processing
   - Text is extracted from PDF
   - Form fields auto-fill with extracted data
7. Submit the receipt
8. **Expected**: Receipt saves successfully with PDF attachment

### ✅ Test 3: Upload Multi-Page PDF
1. Upload a multi-page PDF document
2. Click "Extract Data from Image (OCR)"
3. **Expected**:
   - All pages are processed sequentially
   - Progress updates during processing
   - Text from all pages is combined
   - Form auto-fills with extracted data

### ✅ Test 4: File Size Validation
1. Try uploading a PDF > 10MB
2. **Expected**: Error message appears in UI
3. Try uploading an image > 10MB
4. **Expected**: Error message appears in UI

### ✅ Test 5: File Type Validation
1. Try uploading a .txt or .docx file
2. **Expected**: Error message "Please select an image or PDF file"

### ✅ Test 6: Hebrew Text Recognition
1. Upload a receipt with Hebrew text (PDF or image)
2. Click "Extract Data from Image (OCR)"
3. **Expected**: Hebrew characters are extracted correctly

## Common Issues & Troubleshooting

### Issue: "Failed to process file"
- **Cause**: PDF might be corrupted or have security restrictions
- **Solution**: Try a different PDF file

### Issue: OCR takes a long time
- **Cause**: Large multi-page PDFs or high-resolution images
- **Normal**: 5-15 seconds per page is expected
- **Tip**: Use smaller PDFs (1-3 pages) for receipts

### Issue: Extracted text is garbled
- **Cause**: Low quality scan or handwritten text
- **Solution**: Use higher quality scans or typed receipts

### Issue: Form fields don't auto-fill
- **Cause**: Text format doesn't match expected patterns
- **Solution**: Manually enter data (OCR extracted text appears in notes)

## Browser Console Testing

Open browser developer tools (F12) and check console for:
- PDF.js worker loading confirmation
- OCR processing logs
- Any error messages

## Expected Console Output (Success)
```
Processing PDF with pdfjs-dist...
Converted page 1 to image
Running OCR on page 1...
OCR completed: confidence 87.5%
Form auto-filled with extracted data
```

## Files to Verify
After successful upload, check:
1. Receipt appears in receipts list
2. PDF is viewable when clicking on receipt
3. Supabase Storage has the PDF file
4. Database has correct receipt data

## Performance Expectations
- Image OCR: 3-8 seconds
- Single-page PDF: 5-12 seconds  
- Multi-page PDF (3 pages): 15-30 seconds

## Next Steps After Testing
If all tests pass:
1. ✅ PDF upload works
2. ✅ OCR extracts text from PDFs
3. ✅ Multi-page PDFs are supported
4. ✅ Backend stores PDFs correctly
5. ✅ No regressions in image processing

If any test fails, check the implementation in:
- `/apps/web/src/hooks/useOCR.ts` - PDF processing logic
- `/apps/web/src/components/ReceiptForm.tsx` - UI handling
