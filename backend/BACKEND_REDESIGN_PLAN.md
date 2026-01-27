# CivicLens Backend Redesign Plan

## Document Version: 1.1
## Date: January 28, 2026
## Author: Backend Architecture Team

---

## ✅ IMPLEMENTATION STATUS

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Analysis & Planning | ✅ COMPLETED |
| Phase 1 | User Management + Hierarchy | ✅ COMPLETED |
| Phase 2 | Complaint Management Overhaul | ✅ COMPLETED |
| Phase 3 | Category & Severity System | ✅ NO CHANGES NEEDED |
| Phase 4 | Permissions & Audit Logging | ✅ COMPLETED |
| Phase 5 | Analytics & Reporting | ✅ COMPLETED |
| Phase 6 | Migration & Rollout | ✅ COMPLETED |

### Phase 1 Completed Items:
- ✅ City.js model created
- ✅ Town.js model created  
- ✅ UC.js model created
- ✅ Invitation.js model created (24h expiry tokens)
- ✅ AuditLog.js model created (immutable append-only)
- ✅ User.js updated (new roles, NIC encryption, hierarchy refs)
- ✅ Complaint.js updated (UC/Town/City refs, SLA tracking, immutable fields)
- ✅ ucAssignmentService.js created (geo-fencing UC assignment)
- ✅ invitationService.js created (token management)
- ✅ hierarchyController.js created (City/Town/UC CRUD)
- ✅ invitationController.js created (invitation workflow)
- ✅ hierarchy.js routes created
- ✅ invitation.js routes created
- ✅ authMiddleware.js updated (new role hierarchy, hierarchyAccess)
- ✅ routes/index.js updated with new endpoints

### Phase 2 Completed Items:
- ✅ complaintController.js updated (UC assignment, hierarchy filtering, citizen feedback)
- ✅ complaintRoutes.js updated (new endpoints, role-based access)
- ✅ complaintService.js updated (hierarchy filters, SLA tracking)
- ✅ New endpoints: /my, /sla-breaches, /:id/feedback

### Phase 3 Status:
- ✅ Category model already has slaHours field
- ✅ Severity calculation remains unchanged (rule-based)

### Phase 4 Completed Items:
- ✅ AuditLog.logAction() integrated in controllers
- ✅ Audit logging for: complaint_created, complaint_status_updated, citizen_feedback_submitted
- ✅ Audit logging for: city/town/uc creation/update/deactivation
- ✅ Audit logging for: invitation_created/accepted/revoked/resent

### Phase 5 Completed Items:
- ✅ analyticsController.js created
- ✅ analytics.js routes created
- ✅ UC-level analytics endpoint
- ✅ Town-level analytics endpoint (aggregated from UCs)
- ✅ City-level analytics endpoint (aggregated from Towns)
- ✅ System-wide analytics endpoint (website_admin)
- ✅ SLA performance report endpoint

### Phase 6 Completed Items:
- ✅ scripts/migrate-to-hierarchy.js created
- ✅ Role migration (officer/supervisor → uc_chairman/town_chairman)
- ✅ Sample hierarchy creation (Lahore → 4 Towns → 12 UCs)
- ✅ Complaint-to-UC assignment based on geo-fencing
- ✅ SLA deadline calculation for existing complaints
- ✅ Dry-run mode support (--dry-run flag)

---

# PHASE 0 – ANALYSIS & PLANNING

## 1. Current State Analysis

### 1.1 Existing Models

#### User Model (Current)
```javascript
{
  name, email, phone, password,
  role: ['citizen', 'officer', 'supervisor', 'admin', 'superadmin'],
  department, ward, area,
  isActive, isVerified,
  verificationToken, verificationTokenExpires,
  passwordResetToken, passwordResetExpires,
  refreshToken, refreshTokenExpires,
  lastLogin, loginAttempts, lockUntil,
  complaintsSubmitted: [ObjectId],
  complaintsAssigned: [ObjectId],
  stats: { totalComplaints, resolvedComplaints, avgResolutionTime },
  notifications, avatar
}
```

**Issues Identified:**
- ❌ Roles don't match requirements (officer/supervisor → UC/Town Chairman/Mayor)
- ❌ No UC/Town/City hierarchy references
- ❌ No NIC field for UC/Town Chairman registration
- ❌ No invitation system with token/expiry
- ❌ `department`, `ward`, `area` are strings, not proper references

#### Complaint Model (Current)
```javascript
{
  complaintId, citizenInfo: { name, phone, email },
  description, category: { primary, confidence, subcategory, urgency, keywords, classificationSource },
  location: { type, coordinates, address, area, ward, pincode },
  images: [{ url, publicId, analysis }],
  source: ['web', 'mobile', 'whatsapp', 'voice'],
  status: { current, history },
  severity: { score, priority, factors },
  duplicateOf, linkedComplaints,
  assignedTo: ObjectId (User),
  resolution: { description, resolvedAt, resolvedBy, citizenFeedback },
  metadata
}
```

**Issues Identified:**
- ❌ `assignedTo` should be removed (complaints go to UC, not individual officers)
- ❌ No UC/Town/City references
- ❌ Status enum doesn't match required lifecycle
- ❌ Immutable fields not enforced
- ❌ No SLA tracking per complaint

#### Category Model (Current)
```javascript
{
  name: ['Roads', 'Water', 'Garbage', 'Electricity', 'Others'],
  description, keywords, department, priority, icon, color,
  isActive, avgResolutionTime, slaHours
}
```

**Status:** ✅ Mostly good, minor enhancements needed

#### WhatsAppSession Model (Current)
**Status:** ✅ Good, no major changes needed

---

### 1.2 Fields/Collections to Remove or Refactor

| Field/Collection | Action | Reason |
|-----------------|--------|--------|
| `User.role` enum | **REFACTOR** | Change to ['citizen', 'uc_chairman', 'town_chairman', 'mayor', 'website_admin'] |
| `User.department` | **REMOVE** | Not needed in new hierarchy |
| `User.complaintsAssigned` | **REMOVE** | Assignments go to UCs, not users |
| `Complaint.assignedTo` | **REMOVE** | Replaced by UC reference |
| `User.ward` | **REFACTOR** | Becomes UC reference |
| `User.area` | **REFACTOR** | Becomes Town reference |

### 1.3 New Collections Needed

| Collection | Purpose |
|------------|---------|
| `City` | Top-level geographic entity managed by Mayor |
| `Town` | Middle-level entity managed by Town Chairman |
| `UC` (Union Council) | Base-level entity with geo-fence boundaries |
| `Invitation` | Tracks invitations for UC/Town Chairman/Mayor |
| `AuditLog` | Immutable action tracking |

---

## 2. Hierarchy Structure (UC → Town → City)

```
┌─────────────────────────────────────────────────────────────┐
│                        WEBSITE ADMIN                         │
│                    (System-level access)                     │
│                     ↓ Creates Mayors                         │
├─────────────────────────────────────────────────────────────┤
│                           MAYOR                              │
│                      (Manages 1 City)                        │
│              ↓ Creates/Removes Town Chairmen                 │
│              ↓ Views all complaints in City                  │
│              ↓ Can change assignments                        │
├─────────────────────────────────────────────────────────────┤
│                      TOWN CHAIRMAN                           │
│                   (Manages 1-N UCs)                          │
│            ↓ Creates/Removes UC Chairmen                     │
│            ↓ Views all complaints in Town                    │
│            ✗ Cannot edit complaints                          │
├─────────────────────────────────────────────────────────────┤
│                       UC CHAIRMAN                            │
│                     (Manages 1 UC)                           │
│            ↓ Changes complaint status only                   │
│            ✗ Cannot edit complaint content                   │
├─────────────────────────────────────────────────────────────┤
│                         CITIZEN                              │
│           ↓ Submits complaints                               │
│           ↓ Provides feedback after closure                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Complaint Lifecycle

```
                    ┌──────────────┐
                    │   SUBMITTED  │ ← Initial state (citizen creates)
                    └──────┬───────┘
                           │ (UC Chairman acknowledges)
                    ┌──────▼───────┐
                    │ ACKNOWLEDGED │
                    └──────┬───────┘
                           │ (Work begins)
                    ┌──────▼───────┐
                    │ IN_PROGRESS  │
                    └──────┬───────┘
                           │ (Work complete)
                    ┌──────▼───────┐
                    │   RESOLVED   │
                    └──────┬───────┘
                           │ (Verification period ends)
                    ┌──────▼───────┐
                    │    CLOSED    │
                    └──────┬───────┘
                           │ (Citizen provides feedback)
                    ┌──────▼────────────┐
                    │ CITIZEN_FEEDBACK  │ ← Final state
                    └───────────────────┘
```

### Status Transitions

| From | To | Who Can Transition |
|------|----|--------------------|
| submitted | acknowledged | UC Chairman |
| acknowledged | in_progress | UC Chairman |
| in_progress | resolved | UC Chairman |
| resolved | closed | System (auto) or UC Chairman |
| closed | citizen_feedback | Citizen (provides rating) |

---

## 4. UC Assignment Logic

### Primary: Geo-fencing
```javascript
// UC boundaries stored as GeoJSON Polygon
// Complaint location checked against all UC boundaries
db.ucs.findOne({
  boundary: {
    $geoIntersects: {
      $geometry: complaintLocation
    }
  }
})
```

### Secondary: Manual Selection
- Citizen can manually select UC from dropdown
- System validates selection against city/town hierarchy

### Fallback: Nearest UC
```javascript
// If no exact match, find nearest UC center
db.ucs.aggregate([
  {
    $geoNear: {
      near: complaintLocation,
      distanceField: "distance",
      spherical: true
    }
  },
  { $limit: 1 }
])
```

---

## 5. Security Requirements

### 5.1 Immutable Complaint Fields
Once created, these fields CANNOT be modified:
- `description`
- `images`
- `category.primary`
- `severity.score` (initial calculation)
- `citizenInfo`
- `location.coordinates`

### 5.2 NIC Handling
- UC/Town Chairmen must provide NIC during registration
- NIC stored encrypted (AES-256)
- NIC displayed masked (e.g., `*****-*******-3`)

### 5.3 Invitation Security
- Invitation tokens use crypto-secure random bytes
- 24-hour expiry enforced server-side
- Single-use tokens (invalidated after use)
- Rate-limited invitation creation

---

## 6. Phased Implementation Plan

### PHASE 1: User Management + UC/Town/City (Week 1-2)

#### Sub-tasks:

**1.1 Create Geographic Schemas**
- [ ] Create `City` model with name, coordinates, mayor reference
- [ ] Create `Town` model with name, city reference, chairman reference
- [ ] Create `UC` model with name, town reference, boundary (GeoJSON Polygon), chairman reference

**1.2 Update User Schema**
- [ ] Add new role enum: `['citizen', 'uc_chairman', 'town_chairman', 'mayor', 'website_admin']`
- [ ] Add `nic` field (encrypted)
- [ ] Add `city`, `town`, `uc` references
- [ ] Add `invitedBy` reference
- [ ] Remove `department`, `complaintsAssigned`
- [ ] Rename `ward` → `ucId`, `area` → `townId`

**1.3 Create Invitation Schema**
- [ ] Fields: token, type, email, invitedBy, expiresAt, usedAt, targetRole
- [ ] TTL index for automatic cleanup

**1.4 Implement Invitation APIs**
- [ ] `POST /api/v1/invitations` - Create invitation (role-based)
- [ ] `GET /api/v1/invitations/:token` - Validate invitation
- [ ] `POST /api/v1/auth/register-invited` - Register via invitation

**1.5 Update Auth APIs**
- [ ] Modify register for citizens (standard flow)
- [ ] Add NIC validation for UC/Town Chairman registration
- [ ] Implement OTP/email verification for citizens
- [ ] Add role-based login response (dashboard URLs)

**1.6 Implement Removal APIs**
- [ ] `DELETE /api/v1/users/:id` - Role-based removal
- [ ] Mayor can remove Town Chairmen
- [ ] Town Chairman can remove UC Chairmen
- [ ] Handle email re-invite after removal

---

### PHASE 2: Complaint Management (Week 2-3)

#### Sub-tasks:

**2.1 Update Complaint Schema**
- [ ] Remove `assignedTo` field
- [ ] Add `ucId`, `townId`, `cityId` references
- [ ] Update status enum to new lifecycle
- [ ] Add `slaDeadline` field
- [ ] Add `immutableFieldsLockedAt` timestamp
- [ ] Add `citizenFeedback` as separate sub-document

**2.2 Implement Immutability Middleware**
- [ ] Pre-update hook to prevent modification of immutable fields
- [ ] Audit log entry on any modification attempt

**2.3 Update Status Transition Logic**
- [ ] Validate transitions based on current state
- [ ] Only UC Chairman can change status
- [ ] Add `transitionedBy` to status history

**2.4 Implement UC Assignment Service**
- [ ] Geo-fence lookup function
- [ ] Manual selection validation
- [ ] Nearest UC fallback
- [ ] Assignment mismatch alerts

**2.5 Update Complaint APIs**
- [ ] `POST /api/v1/complaints` - Add UC assignment logic
- [ ] `PATCH /api/v1/complaints/:id/status` - Role enforcement
- [ ] `POST /api/v1/complaints/:id/feedback` - Citizen feedback endpoint
- [ ] `GET /api/v1/complaints/uc/:ucId` - Fetch by UC
- [ ] `GET /api/v1/complaints/town/:townId` - Fetch by Town
- [ ] `GET /api/v1/complaints/city/:cityId` - Fetch by City

**2.6 WhatsApp Integration Updates**
- [ ] Auto-register citizen if phone not found
- [ ] Integrate UC lookup in conversation flow
- [ ] AI classification confirmation step
- [ ] Location-based UC assignment

---

### PHASE 3: Category & Severity Management (Week 3-4)

#### Sub-tasks:

**3.1 Update Category Schema**
- [ ] Add `isActive` toggle
- [ ] Add `slaHours` per category
- [ ] Add `aiKeywords` for classification
- [ ] Add `priority` weight

**3.2 Implement AI Classification Endpoint**
- [ ] `POST /api/v1/categories/classify`
- [ ] Return category, confidence, suggested keywords

**3.3 Severity Calculation on Creation**
- [ ] Calculate severity at complaint creation
- [ ] Store as immutable initial value
- [ ] Add `severityLockedAt` timestamp

**3.4 Severity APIs**
- [ ] `GET /api/v1/severity/factors` - Get severity calculation factors
- [ ] Document severity algorithm for transparency

---

### PHASE 4: Permissions & Audit (Week 4)

#### Sub-tasks:

**4.1 Create AuditLog Schema**
- [ ] Fields: userId, action, resource, resourceId, oldValue, newValue, timestamp, ipAddress
- [ ] Immutable collection (no updates/deletes)

**4.2 Implement Audit Middleware**
- [ ] Log all mutations (POST, PATCH, DELETE)
- [ ] Log login/logout events
- [ ] Log status transitions
- [ ] Log failed authorization attempts

**4.3 Role-Based Access Matrix**

| Action | Citizen | UC Chairman | Town Chairman | Mayor | Admin |
|--------|---------|-------------|---------------|-------|-------|
| Submit complaint | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own complaints | ✅ | ✅ | ✅ | ✅ | ✅ |
| View UC complaints | ❌ | ✅ (own UC) | ✅ (own town) | ✅ (own city) | ✅ |
| Change status | ❌ | ✅ | ❌ | ❌ | ❌ |
| Provide feedback | ✅ (own) | ❌ | ❌ | ❌ | ❌ |
| Invite UC Chairman | ❌ | ❌ | ✅ | ❌ | ❌ |
| Invite Town Chairman | ❌ | ❌ | ❌ | ✅ | ❌ |
| Invite Mayor | ❌ | ❌ | ❌ | ❌ | ✅ |
| Remove UC Chairman | ❌ | ❌ | ✅ | ❌ | ❌ |
| Remove Town Chairman | ❌ | ❌ | ❌ | ✅ | ❌ |
| View dashboards | ❌ | ✅ (UC) | ✅ (Town) | ✅ (City) | ✅ (All) |

**4.4 Implement Permission Middleware**
- [ ] `checkComplaintAccess` - Verify user can access specific complaint
- [ ] `checkHierarchyAccess` - Verify user's hierarchy level
- [ ] `checkStatusTransition` - Verify valid status change

---

### PHASE 5: Analytics & Reporting (Week 5)

#### Sub-tasks:

**5.1 Metrics Aggregation**
- [ ] Complaint counts per UC/Town/City
- [ ] SLA breaches per category
- [ ] Average resolution times
- [ ] Status distribution

**5.2 Heatmap Enhancements**
- [ ] Filter by UC/Town/City boundaries
- [ ] Category-specific heatmaps
- [ ] Severity-weighted intensity

**5.3 Dashboard APIs**
- [ ] `GET /api/v1/dashboard/uc/:ucId` - UC Chairman dashboard
- [ ] `GET /api/v1/dashboard/town/:townId` - Town Chairman dashboard
- [ ] `GET /api/v1/dashboard/city/:cityId` - Mayor dashboard

**5.4 Feedback Reports**
- [ ] Aggregate citizen satisfaction per UC
- [ ] Trend analysis over time
- [ ] Export functionality

**5.5 SLA Tracking**
- [ ] SLA breach detection job (cron)
- [ ] Escalation alerts
- [ ] SLA compliance percentage

---

### PHASE 6: Migration & QA (Week 6)

#### Sub-tasks:

**6.1 Data Migration Scripts**
- [ ] Backup existing data
- [ ] Map old roles → new roles
- [ ] Create default City/Town/UC structure
- [ ] Assign complaints to UCs based on location
- [ ] Preserve status history

**6.2 Role Mapping**
```javascript
// Old → New
'citizen' → 'citizen'
'officer' → 'uc_chairman' // If managing UC
'supervisor' → 'town_chairman' // If managing Town
'admin' → 'mayor' // If managing City
'superadmin' → 'website_admin'
```

**6.3 Test Scenarios**
- [ ] Geo-fencing UC assignment accuracy
- [ ] WhatsApp complaint submission flow
- [ ] Web complaint submission flow
- [ ] Role-based access enforcement
- [ ] SLA breach calculations
- [ ] Invitation workflow (create → register)
- [ ] Status transition validation
- [ ] Immutable field protection

**6.4 Documentation**
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Role permissions matrix
- [ ] Database schema diagrams
- [ ] Deployment runbook
- [ ] Troubleshooting guide

---

## 7. New File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js           # Updated with new roles
│   │   ├── Complaint.js      # Updated with UC/Town/City refs
│   │   ├── Category.js       # Minor updates
│   │   ├── City.js           # NEW
│   │   ├── Town.js           # NEW
│   │   ├── UC.js             # NEW
│   │   ├── Invitation.js     # NEW
│   │   ├── AuditLog.js       # NEW
│   │   └── WhatsAppSession.js
│   │
│   ├── controllers/
│   │   ├── authController.js       # Updated
│   │   ├── complaintController.js  # Updated
│   │   ├── categoryController.js
│   │   ├── dashboardController.js  # NEW
│   │   ├── invitationController.js # NEW
│   │   ├── hierarchyController.js  # NEW (City/Town/UC CRUD)
│   │   └── voiceController.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── complaintService.js     # Updated
│   │   ├── ucAssignmentService.js  # NEW
│   │   ├── invitationService.js    # NEW
│   │   ├── slaService.js           # NEW
│   │   ├── auditService.js         # NEW
│   │   ├── dashboardService.js     # NEW
│   │   └── ... (existing services)
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js       # Updated
│   │   ├── permissionMiddleware.js # NEW
│   │   ├── auditMiddleware.js      # NEW
│   │   ├── immutableMiddleware.js  # NEW
│   │   └── ... (existing)
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # Updated
│   │   ├── complaintRoutes.js      # Updated
│   │   ├── dashboardRoutes.js      # NEW
│   │   ├── invitationRoutes.js     # NEW
│   │   ├── hierarchyRoutes.js      # NEW
│   │   └── ... (existing)
│   │
│   ├── jobs/
│   │   ├── slaChecker.js           # NEW - Cron job for SLA
│   │   └── statusAutoClose.js      # NEW - Auto-close resolved
│   │
│   └── utils/
│       ├── encryption.js           # NEW - NIC encryption
│       └── ... (existing)
│
├── scripts/
│   ├── migrate-roles.js            # NEW
│   ├── migrate-complaints.js       # NEW
│   ├── seed-hierarchy.js           # NEW
│   └── ... (existing)
│
└── tests/
    ├── unit/
    │   ├── ucAssignment.test.js    # NEW
    │   ├── permissions.test.js     # NEW
    │   └── ...
    └── integration/
        ├── complaintFlow.test.js   # NEW
        ├── invitationFlow.test.js  # NEW
        └── ...
```

---

## 8. API Endpoints Summary

### New/Updated Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/invitations` | Create invitation | Mayor, Town Chairman, Admin |
| GET | `/api/v1/invitations/:token` | Validate invitation | Public |
| POST | `/api/v1/auth/register-invited` | Register via invitation | Public |
| POST | `/api/v1/complaints/:id/feedback` | Submit citizen feedback | Citizen (own) |
| GET | `/api/v1/complaints/uc/:ucId` | Get UC complaints | UC/Town/Mayor |
| GET | `/api/v1/complaints/town/:townId` | Get Town complaints | Town/Mayor |
| GET | `/api/v1/complaints/city/:cityId` | Get City complaints | Mayor |
| GET | `/api/v1/dashboard/uc/:ucId` | UC dashboard metrics | UC Chairman |
| GET | `/api/v1/dashboard/town/:townId` | Town dashboard metrics | Town Chairman |
| GET | `/api/v1/dashboard/city/:cityId` | City dashboard metrics | Mayor |
| POST | `/api/v1/hierarchy/cities` | Create city | Admin |
| POST | `/api/v1/hierarchy/towns` | Create town | Mayor |
| POST | `/api/v1/hierarchy/ucs` | Create UC | Town Chairman |
| GET | `/api/v1/sla/breaches` | Get SLA breaches | UC/Town/Mayor |
| GET | `/api/v1/audit-logs` | Get audit logs | Admin |

---

## 9. Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 0 | 2 days | This document, analysis complete |
| Phase 1 | 1 week | User schemas, hierarchy, invitations |
| Phase 2 | 1 week | Complaint lifecycle, UC assignment |
| Phase 3 | 3 days | Category updates, severity |
| Phase 4 | 3 days | Permissions, audit logging |
| Phase 5 | 4 days | Analytics, dashboards |
| Phase 6 | 3 days | Migration, testing, docs |

**Total Estimated Duration: 5-6 weeks**

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Full backup before migration, staged rollout |
| Breaking existing integrations | API versioning (/v2), backward compatibility period |
| Geo-fence accuracy | Thorough testing with real coordinates, fallback to nearest UC |
| Performance with new queries | Add appropriate indexes, query optimization |
| Security of NIC data | AES-256 encryption, audit logging, access controls |

---

## 11. Next Steps

1. ✅ Complete Phase 0 analysis (this document)
2. 🔄 Review with stakeholders
3. ⏳ Begin Phase 1 implementation
4. ⏳ Set up development/staging environments
5. ⏳ Create database migration scripts

---

*Document maintained by: Backend Architecture Team*
*Last Updated: January 28, 2026*
