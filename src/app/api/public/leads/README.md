# Public Lead Capture Endpoint - DISABLED

## Status: Awaiting Schema Implementation

The lead capture API (`route.ts.DISABLED`) has been temporarily disabled because the Prisma schema does not include a `Lead` model.

## Schema Alignment Required

### Current Situation:
- `LeadTask` model exists in schema and references `leadId`
- No `Lead` model exists in schema
- `Member` model has statuses: ACTIVE, INACTIVE, SUSPENDED, PENDING, CANCELLED (no LEAD status)

### Recommended Solution:
Add a dedicated `Lead` model to the Prisma schema:

```prisma
model Lead {
  id                  String      @id @default(uuid())
  tenantId            String
  branchId            String?
  name                String
  phone               String
  email               String?
  source              String?     // 'website', 'facebook', 'referral', etc.
  status              String      @default("new") // 'new', 'contacted', 'qualified', 'lost', 'converted'
  interestedIn        String?     // 'membership', 'personal-training', etc.
  preferredContactTime String?
  notes               String?
  assignedTo          String?     // User ID
  lastContactedAt     DateTime?
  convertedToMemberId String?     // When lead becomes a member
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  // Relationships
  tenant    Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  branch    Branch?     @relation(fields: [branchId], references: [id])
  tasks     LeadTask[]

  @@map("leads")
}
```

### Alternative Solution:
Use `Member` model with a new `LEAD` status enum value, but this mixes concerns and makes member queries more complex.

## Enabling the Endpoint

Once the Lead model is added to the schema:

1. Run `npm run db:push` to sync schema changes
2. Rename `route.ts.DISABLED` back to `route.ts`
3. Test the endpoint with: `POST /api/public/leads`

## API Documentation

### POST /api/public/leads

Create a new lead from a public form submission.

**Rate Limiting:** 10 requests per minute per IP

**Request Body:**
```json
{
  "tenantId": "required-uuid",
  "branchId": "optional-uuid",
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "source": "website",
  "interestedIn": "membership",
  "preferredContactTime": "afternoon",
  "message": "Interested in joining"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "leadId": "uuid"
}
```

**Features:**
- Duplicate detection (phone + tenant)
- Automatic task creation for follow-up
- Tenant and branch validation
- Rate limiting by IP address
- Updates existing leads instead of creating duplicates

### GET /api/public/leads?tenantId=uuid

Get lead form configuration for a specific tenant.

**Response:**
```json
{
  "tenantId": "uuid",
  "tenantName": "Gym Name",
  "branches": [{ "id": "uuid", "name": "Main Branch", "city": "City" }],
  "sources": ["website", "facebook", "instagram", "google", "referral", "walk-in"],
  "interestedInOptions": ["membership", "personal-training", "group-classes", "nutrition", "general-inquiry"]
}
```
