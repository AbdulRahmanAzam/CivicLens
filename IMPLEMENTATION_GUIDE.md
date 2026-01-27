# CivicLens – Complete Implementation Guide

> **Version**: 2.0  
> **Date**: January 2026  
> **Status**: Source of Truth for Development

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Target Users & Stakeholders](#2-target-users--stakeholders)
3. [Complete Application Flow](#3-complete-application-flow)
4. [Role-Based Permissions Matrix](#4-role-based-permissions-matrix)
5. [Data Model Redesign](#5-data-model-redesign)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [AI & Automation](#8-ai--automation)
9. [Scalability & Governance](#9-scalability--governance)
10. [Implementation Phase Plan](#10-implementation-phase-plan)

---

# 1. System Overview

## 1.1 What is CivicLens?

CivicLens is a **geo-based civic grievance management system** designed for local government operations in Pakistan's administrative hierarchy. It replaces paper-based complaint systems with a digital, auditable, SLA-driven platform.

**Core Function**: Citizens report civic issues → Issues route to the correct Union Council (UC) → Officers resolve → Chairmen verify → Data informs governance.

## 1.2 Problems Solved

| Problem | CivicLens Solution |
|---------|-------------------|
| Complaints lost in bureaucracy | Digital tracking with unique IDs |
| No accountability | Status history, timestamps, audit trail |
| Wrong department routing | AI classification + geo-based UC routing |
| No visibility for citizens | Real-time status tracking |
| No data for governance | Analytics dashboards for Town/UC Chairmen |
| Slow response times | SLA enforcement with escalation |
| Duplicate complaints | AI-powered duplicate detection |

## 1.3 Why UC-First Governance Matters

Pakistan's local government structure:

```
┌─────────────────────────────────────────────────────────────┐
│                        PROVINCE                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    DISTRICT                          │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │                   TOWN                       │    │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │    │    │
│  │  │  │   UC 1   │ │   UC 2   │ │   UC 3   │    │    │    │
│  │  │  │(15-20k   │ │          │ │          │    │    │    │
│  │  │  │ people)  │ │          │ │          │    │    │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘    │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**UC (Union Council)** is the smallest administrative unit. This is where:
- Complaints originate
- Local officers work
- Resolution happens
- Accountability is direct

**Town** oversees multiple UCs and:
- Allocates resources
- Monitors performance
- Handles escalations
- Reports to district

CivicLens is UC-first because that's where civic issues are resolved.

## 1.4 How CivicLens Differs from Generic Complaint Portals

| Generic Portal | CivicLens |
|---------------|-----------|
| Flat hierarchy | UC → Town → District hierarchy |
| Manual routing | Geo-based auto-routing to UC |
| Category-only | Category + Severity + Urgency |
| No SLA | Department-specific SLAs |
| No verification | Chairman verification before closure |
| No escalation | Auto-escalation on SLA breach |
| Basic analytics | Role-based analytics (UC/Town/NGO) |

---

# 2. Target Users & Stakeholders

## 2.1 User Roles

### Citizen
- **Who**: Any resident within a UC's geographic boundary
- **Goal**: Report issues, track resolution, provide feedback
- **Access**: Mobile app, web, WhatsApp
- **Data Access**: Own complaints only

### Department Officer
- **Who**: Government employee assigned to a department (Roads, Water, etc.)
- **Goal**: Resolve assigned complaints within SLA
- **Access**: Officer dashboard (web/mobile)
- **Data Access**: Assigned complaints in their UC/department
- **Reports To**: UC Chairman

### UC Chairman
- **Who**: Elected head of a Union Council
- **Goal**: Oversee all complaints in UC, assign officers, verify resolutions
- **Access**: UC Chairman dashboard
- **Data Access**: All complaints in their UC
- **Reports To**: Town Chairman
- **Manages**: Officers within UC

### Town Chairman
- **Who**: Elected head of a Town (oversees multiple UCs)
- **Goal**: Monitor UC performance, handle escalations, allocate resources
- **Access**: Town Chairman dashboard
- **Data Access**: All complaints across all UCs in their Town
- **Manages**: UC Chairmen (adds/removes them in the system)

### Admin
- **Who**: System administrators (not government officials)
- **Goal**: System configuration, user management, technical operations
- **Access**: Admin panel
- **Data Access**: System-wide (for technical purposes only)
- **Does NOT**: Make governance decisions

### NGO (Read-Only)
- **Who**: Non-governmental organizations, researchers, journalists
- **Goal**: Access anonymized analytics for transparency/research
- **Access**: Public analytics dashboard
- **Data Access**: Aggregated, anonymized statistics only

## 2.2 Stakeholder Needs Matrix

| Stakeholder | Primary Need | Secondary Need | Key Metric |
|-------------|-------------|----------------|------------|
| Citizen | Fast resolution | Transparency | Time to resolve |
| Officer | Clear assignments | Manageable workload | Complaints resolved |
| UC Chairman | UC performance | Resource visibility | Resolution rate |
| Town Chairman | Town-wide oversight | UC comparison | SLA compliance |
| Admin | System stability | Easy config | Uptime |
| NGO | Data access | Data accuracy | Report quality |
| Government | Accountability | Efficiency | Public satisfaction |

---

# 3. Complete Application Flow

## 3.1 High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLAINT LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ CITIZEN  │───▶│  SUBMIT  │───▶│    AI    │───▶│  ROUTE   │              │
│  │          │    │ Complaint│    │ Process  │    │  to UC   │              │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘              │
│                                                        │                     │
│       ┌────────────────────────────────────────────────┘                     │
│       ▼                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │    UC    │───▶│  ASSIGN  │───▶│ OFFICER  │───▶│ RESOLVE  │              │
│  │ Chairman │    │ to Officer│   │  Works   │    │  Issue   │              │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘              │
│                                                        │                     │
│       ┌────────────────────────────────────────────────┘                     │
│       ▼                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  VERIFY  │───▶│ CITIZEN  │───▶│ FEEDBACK │───▶│  CLOSE   │              │
│  │ Chairman │    │ Notified │    │  Rating  │    │          │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                         ESCALATION PATH (SLA BREACH)                         │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                               │
│  │   SLA    │───▶│ ESCALATE │───▶│   TOWN   │                               │
│  │ Breached │    │ to Town  │    │ Chairman │                               │
│  └──────────┘    └──────────┘    └──────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Step-by-Step Flow

### Step 1: Complaint Submission

**Channels**:
- Mobile App (primary)
- Web App
- WhatsApp Bot

**Required Data**:
| Field | Required | Source |
|-------|----------|--------|
| Description | Yes | User input |
| Location (lat/lng) | Yes | GPS / Map pin |
| Phone | Yes | User input |
| Name | No | User input |
| Images | No | Camera / Upload |
| Address | No | User input / Reverse geocode |

**Process**:
1. Citizen opens app/web/WhatsApp
2. Taps "Report Issue"
3. Allows location access OR manually pins on map
4. Describes the issue (text or voice)
5. Optionally adds photos (max 5)
6. Provides phone number
7. Submits

**Backend Actions**:
1. Validate input
2. Generate `complaintId` (format: `CL-YYYYMMDD-XXXXX`)
3. Reverse geocode to get address if not provided
4. Proceed to AI processing

### Step 2: AI Processing Pipeline

**2a. Classification**
```
Input: complaint.description
Process: GROQ LLM → Fallback to local TF-IDF
Output: {
  category: "Roads" | "Water" | "Garbage" | "Electricity" | "Others",
  subcategory: "pothole" | "leak" | etc.,
  confidence: 0.0-1.0,
  urgency: "low" | "medium" | "high" | "critical",
  keywords: ["pothole", "road", "broken"],
  needsReview: boolean
}
```

**2b. Duplicate Detection**
```
Input: complaint.location + complaint.description + complaint.category
Process: 
  - Find complaints within 500m radius
  - Same category
  - Created in last 7 days
  - Text similarity > 0.7
Output: {
  isDuplicate: boolean,
  potentialDuplicate: complaintId | null,
  similarity: 0.0-1.0,
  nearbyCount: number
}
```

**2c. Severity Scoring**
```
Input: category, urgency, location, description
Process: Rule-based scoring
Factors:
  - Category urgency (Electricity = high, Garbage = medium)
  - Keyword urgency ("dangerous", "children" = boost)
  - Area density (complaints/km² in last 30 days)
  - Reported urgency
Output: {
  score: 1-10,
  priority: "low" | "medium" | "high" | "critical",
  factors: { categoryUrgency, areaImpact, keywordUrgency, ... }
}
```

### Step 3: UC Routing

**Process**:
1. Get complaint coordinates `[lng, lat]`
2. Query UC collection: `UC.findOne({ boundary: { $geoIntersects: { $geometry: point } } })`
3. If no UC found → flag for manual review
4. Assign `complaint.ucId = uc._id`
5. Notify UC Chairman (push + SMS)

**Edge Cases**:
- Coordinates on UC boundary → assign to nearest UC centroid
- Invalid coordinates → flag for manual review
- UC has no active chairman → escalate to Town immediately

### Step 4: Officer Assignment

**Actor**: UC Chairman

**Process**:
1. UC Chairman sees new complaint in dashboard
2. Views complaint details, location, category
3. Selects officer from available officers (filtered by department)
4. Sets expected resolution date (within SLA)
5. Adds optional notes
6. Assigns

**System Actions**:
1. Create `Assignment` record
2. Update `complaint.status.current = "assigned"`
3. Add to `complaint.status.history`
4. Notify Officer (push + SMS)
5. Start SLA countdown

**Auto-Assignment Option** (Phase 3):
- Round-robin within department
- Load-balanced based on current assignments
- Skill-based routing

### Step 5: Officer Resolution

**Actor**: Department Officer

**Process**:
1. Officer receives assignment notification
2. Opens officer dashboard
3. Views complaint details, location, images
4. Navigates to location (map integration)
5. Performs resolution work
6. Takes "after" photos
7. Adds resolution notes
8. Marks as "resolved"

**Required Resolution Data**:
| Field | Required |
|-------|----------|
| Resolution description | Yes |
| After photos | Recommended |
| Actual work done | Yes |
| Resources used | No |

**System Actions**:
1. Create `Resolution` record
2. Update `complaint.status.current = "pending_verification"`
3. Notify UC Chairman
4. Notify Citizen

### Step 6: Chairman Verification

**Actor**: UC Chairman

**Process**:
1. UC Chairman sees complaint in "Pending Verification" queue
2. Reviews resolution details and photos
3. Optionally visits site
4. Decision:
   - **Approve** → proceeds to citizen feedback
   - **Reject** → returns to officer with notes

**If Rejected**:
1. Update `complaint.status.current = "reopened"`
2. Create new assignment to same or different officer
3. Notify officer
4. SLA restarts

**If Approved**:
1. Update `complaint.status.current = "verified"`
2. Notify citizen for feedback
3. Set 48-hour feedback window

### Step 7: Citizen Feedback

**Actor**: Citizen

**Process**:
1. Citizen receives notification
2. Opens complaint in app
3. Views resolution details and photos
4. Rates resolution (1-5 stars)
5. Adds optional comment
6. Confirms satisfaction OR reopens

**If Satisfied**:
1. Update `complaint.status.current = "closed"`
2. Store feedback in `Resolution.citizenFeedback`
3. Complaint lifecycle complete

**If Not Satisfied**:
1. Update `complaint.status.current = "reopened"`
2. Citizen provides reason
3. Escalate to UC Chairman
4. UC Chairman must reassign or escalate to Town

### Step 8: Closure

**Final State**: `status.current = "closed"`

**Closed Complaint Contains**:
- Complete status history
- All assignments
- Resolution details
- Citizen feedback
- Total time from submission to closure
- SLA compliance flag

## 3.3 Escalation Flow

### Automatic Escalation Triggers

| Trigger | Action |
|---------|--------|
| SLA 50% elapsed, no assignment | Notify UC Chairman |
| SLA 75% elapsed, not resolved | Notify UC + Town Chairman |
| SLA breached | Escalate to Town Chairman |
| 2+ reopens on same complaint | Escalate to Town Chairman |
| UC Chairman inactive 48h | Escalate to Town Chairman |

### Escalation Process

1. **System detects trigger**
2. **Create `Escalation` record**
   - `originalUcId`
   - `escalatedToTownId`
   - `reason`
   - `escalatedAt`
3. **Notify Town Chairman**
4. **Town Chairman can**:
   - Reassign to different officer
   - Transfer to different UC
   - Add resources
   - Mark as special case
5. **Track escalation resolution separately**

---

# 4. Role-Based Permissions Matrix

## 4.1 Action Permissions

| Action | Citizen | Officer | UC Chairman | Town Chairman | Admin |
|--------|---------|---------|-------------|---------------|-------|
| Create complaint | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own complaints | ✅ | ❌ | ❌ | ❌ | ❌ |
| View assigned complaints | ❌ | ✅ | ❌ | ❌ | ❌ |
| View UC complaints | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Town complaints | ❌ | ❌ | ❌ | ✅ | ❌ |
| View all complaints | ❌ | ❌ | ❌ | ❌ | ✅ |
| Assign to officer | ❌ | ❌ | ✅ | ✅ | ❌ |
| Resolve complaint | ❌ | ✅ | ❌ | ❌ | ❌ |
| Verify resolution | ❌ | ❌ | ✅ | ✅ | ❌ |
| Reject resolution | ❌ | ❌ | ✅ | ✅ | ❌ |
| Escalate to Town | ❌ | ❌ | ✅ | ❌ | ❌ |
| Handle escalation | ❌ | ❌ | ❌ | ✅ | ❌ |
| Provide feedback | ✅ | ❌ | ❌ | ❌ | ❌ |
| Reopen complaint | ✅ | ❌ | ✅ | ✅ | ❌ |
| View UC analytics | ❌ | ❌ | ✅ | ✅ | ❌ |
| View Town analytics | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage UC Chairmen | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage Officers | ❌ | ❌ | ✅ | ✅ | ❌ |
| System configuration | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage categories | ❌ | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ❌ | ❌ | ✅ |

## 4.2 Data Visibility

| Data | Citizen | Officer | UC Chairman | Town Chairman | Admin | NGO |
|------|---------|---------|-------------|---------------|-------|-----|
| Own complaint full details | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assigned complaint details | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| UC complaint details | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Town complaint details | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Citizen PII | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Officer performance | ❌ | Own | UC officers | All officers | ✅ | Aggregated |
| UC performance | ❌ | ❌ | Own UC | All UCs | ✅ | Aggregated |
| Town performance | ❌ | ❌ | ❌ | Own Town | ✅ | Aggregated |
| Aggregated stats | ❌ | ❌ | UC level | Town level | All | Town+ |

## 4.3 Status Transition Permissions

| Current Status | Next Status | Who Can Transition |
|---------------|-------------|-------------------|
| `reported` | `assigned` | UC Chairman, Town Chairman |
| `reported` | `rejected` | UC Chairman, Town Chairman |
| `assigned` | `in_progress` | Officer |
| `in_progress` | `resolved` | Officer |
| `resolved` | `pending_verification` | System (auto) |
| `pending_verification` | `verified` | UC Chairman, Town Chairman |
| `pending_verification` | `reopened` | UC Chairman, Town Chairman |
| `verified` | `closed` | Citizen (via feedback), System (timeout) |
| `verified` | `reopened` | Citizen |
| `reopened` | `assigned` | UC Chairman, Town Chairman |
| Any | `escalated` | System (auto), UC Chairman |
| `escalated` | `assigned` | Town Chairman |

---

# 5. Data Model Redesign

## 5.1 Model Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA MODEL RELATIONSHIPS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│    │   Town   │ 1────M  │    UC    │ 1────M  │   User   │                   │
│    │          │         │          │         │ (Officer)│                   │
│    └────┬─────┘         └────┬─────┘         └────┬─────┘                   │
│         │                    │                    │                          │
│         │ 1                  │ 1                  │ M                        │
│         │                    │                    │                          │
│         ▼ M                  ▼ M                  ▼ 1                        │
│    ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│    │   User   │         │Complaint │ M────1  │Assignment│                   │
│    │(Chairman)│         │          │         │          │                   │
│    └──────────┘         └────┬─────┘         └──────────┘                   │
│                              │                                               │
│                              │ 1                                             │
│                              │                                               │
│         ┌────────────────────┼────────────────────┐                         │
│         │                    │                    │                          │
│         ▼ M                  ▼ 1                  ▼ M                        │
│    ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│    │Escalation│         │Resolution│         │  Status  │                   │
│    │          │         │          │         │ History  │                   │
│    └──────────┘         └──────────┘         └──────────┘                   │
│                                                                              │
│    ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│    │ Category │         │Department│         │  Audit   │                   │
│    │          │         │          │         │   Log    │                   │
│    └──────────┘         └──────────┘         └──────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Town Model

**Purpose**: Represents a Town administrative unit containing multiple UCs.

```javascript
const TownSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^[A-Z]{2,5}-\d{3}$/  // e.g., "LHR-001"
  },
  
  // Hierarchy
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    index: true
  },
  
  // Geography
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]],  // GeoJSON Polygon
      required: true
    }
  },
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]  // [lng, lat]
  },
  
  // Leadership
  chairmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Metadata
  population: Number,
  area: Number,  // sq km
  ucCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
TownSchema.index({ boundary: '2dsphere' });
TownSchema.index({ code: 1 });
TownSchema.index({ status: 1 });
```

**Validation Rules**:
- `code` must be unique across system
- `boundary` must be valid GeoJSON Polygon
- `chairmanId` must reference User with role `town_chairman`

---

## 5.3 UC (Union Council) Model

**Purpose**: Represents the smallest administrative unit where complaints are managed.

```javascript
const UCSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^UC-\d{4}$/  // e.g., "UC-0042"
  },
  ucNumber: {
    type: Number,
    required: true
  },
  
  // Hierarchy
  townId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Town',
    required: true,
    index: true
  },
  
  // Geography
  boundary: {
    type: {
      type: String,
      enum: ['Polygon', 'MultiPolygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  
  // Leadership
  chairmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Stats (denormalized for performance)
  stats: {
    totalComplaints: { type: Number, default: 0 },
    openComplaints: { type: Number, default: 0 },
    resolvedLast30Days: { type: Number, default: 0 },
    avgResolutionHours: { type: Number, default: 0 },
    slaComplianceRate: { type: Number, default: 100 }  // percentage
  },
  
  // Metadata
  population: Number,
  area: Number,
  officerCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
UCSchema.index({ boundary: '2dsphere' });
UCSchema.index({ townId: 1, status: 1 });
UCSchema.index({ code: 1 });

// Static: Find UC by coordinates
UCSchema.statics.findByLocation = function(lng, lat) {
  return this.findOne({
    boundary: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }
    },
    status: 'active'
  });
};
```

---

## 5.4 Department Model

**Purpose**: Government departments that handle specific complaint categories.

```javascript
const DepartmentSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Responsibility
  categories: [{
    type: String,
    enum: ['Roads', 'Water', 'Garbage', 'Electricity', 'Sanitation', 'Parks', 'Buildings', 'Others']
  }],
  
  // SLA Configuration
  sla: {
    defaultHours: { type: Number, default: 72 },
    criticalHours: { type: Number, default: 24 },
    highHours: { type: Number, default: 48 },
    mediumHours: { type: Number, default: 72 },
    lowHours: { type: Number, default: 120 }
  },
  
  // Contact
  headName: String,
  headPhone: String,
  headEmail: String,
  officeAddress: String,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Display
  icon: String,
  color: String
}, {
  timestamps: true
});
```

---

## 5.5 User Model (Redesigned)

**Purpose**: All system users with role-based access.

```javascript
const UserSchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^\+?[\d\s-]{10,15}$/
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/
  },
  cnic: {
    type: String,
    sparse: true,
    unique: true,
    match: /^\d{5}-\d{7}-\d{1}$/  // Pakistan CNIC format
  },
  
  // Authentication
  passwordHash: String,
  pin: String,  // 4-digit PIN for simple auth
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  
  // Role & Access
  role: {
    type: String,
    enum: ['citizen', 'officer', 'uc_chairman', 'town_chairman', 'admin', 'ngo'],
    required: true,
    index: true
  },
  
  // Organizational Assignment
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  ucId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UC',
    index: true
  },
  townId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Town',
    index: true
  },
  
  // Officer-specific
  designation: String,
  employeeId: String,
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'active',
    index: true
  },
  
  // Activity
  lastLogin: Date,
  lastActive: Date,
  deviceTokens: [String],  // for push notifications
  
  // Profile
  avatar: String,
  address: String,
  
  // Stats (for officers)
  stats: {
    totalAssigned: { type: Number, default: 0 },
    totalResolved: { type: Number, default: 0 },
    avgResolutionHours: { type: Number, default: 0 },
    currentLoad: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ ucId: 1, role: 1 });
UserSchema.index({ townId: 1, role: 1 });
UserSchema.index({ phone: 1 });

// Virtuals
UserSchema.virtual('isChairman').get(function() {
  return ['uc_chairman', 'town_chairman'].includes(this.role);
});

UserSchema.virtual('isOfficer').get(function() {
  return this.role === 'officer';
});
```

**Validation Rules**:
- `officer` must have `ucId` and `departmentId`
- `uc_chairman` must have `ucId`
- `town_chairman` must have `townId`
- Phone must be unique and valid format
- CNIC required for officers and chairmen

---

## 5.6 Category Model (Enhanced)

**Purpose**: Complaint categories with SLA and routing configuration.

```javascript
const CategorySchema = new mongoose.Schema({
  // Identity
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Roads', 'Water', 'Garbage', 'Electricity', 'Sanitation', 'Parks', 'Buildings', 'Others']
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  
  // Classification
  keywords: [{
    type: String,
    lowercase: true
  }],
  subcategories: [{
    name: String,
    keywords: [String],
    slaHours: Number
  }],
  
  // Routing
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  
  // SLA Configuration
  sla: {
    defaultHours: { type: Number, required: true },
    criticalHours: { type: Number, required: true },
    highHours: { type: Number, required: true },
    mediumHours: { type: Number, required: true },
    lowHours: { type: Number, required: true }
  },
  
  // Severity
  basePriority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Display
  icon: String,
  color: String,
  order: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});
```

---

## 5.7 Complaint Model (Redesigned)

**Purpose**: Core entity representing a citizen grievance.

```javascript
const ComplaintSchema = new mongoose.Schema({
  // Identity
  complaintId: {
    type: String,
    unique: true,
    required: true,
    index: true
    // Format: CL-YYYYMMDD-XXXXX
  },
  
  // Citizen Info (embedded)
  citizen: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    name: { type: String, trim: true },
    phone: { type: String, required: true },
    email: String,
    isAnonymous: { type: Boolean, default: false }
  },
  
  // Content
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Category (AI-determined or manual)
  category: {
    primary: {
      type: String,
      enum: ['Roads', 'Water', 'Garbage', 'Electricity', 'Sanitation', 'Parks', 'Buildings', 'Others'],
      required: true,
      index: true
    },
    subcategory: String,
    confidence: { type: Number, min: 0, max: 1 },
    keywords: [String],
    classificationSource: {
      type: String,
      enum: ['ai_groq', 'ai_local', 'manual', 'default'],
      default: 'ai_local'
    },
    needsReview: { type: Boolean, default: false }
  },
  
  // Location (GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],  // [lng, lat]
      required: true
    },
    address: String,
    area: String,
    landmark: String,
    pincode: String
  },
  
  // Administrative Assignment
  ucId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UC',
    required: true,
    index: true
  },
  townId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Town',
    required: true,
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  
  // Current Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedAt: Date,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Status
  status: {
    current: {
      type: String,
      enum: [
        'reported',           // Just submitted
        'assigned',           // Assigned to officer
        'in_progress',        // Officer working on it
        'resolved',           // Officer claims resolved
        'pending_verification', // Awaiting chairman verification
        'verified',           // Chairman verified
        'closed',             // Citizen confirmed or auto-closed
        'reopened',           // Reopened after rejection
        'rejected',           // Rejected as invalid
        'escalated'           // Escalated to higher authority
      ],
      default: 'reported',
      index: true
    },
    history: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedByRole: String,
      remarks: String,
      metadata: mongoose.Schema.Types.Mixed
    }]
  },
  
  // Severity (AI-calculated)
  severity: {
    score: { type: Number, min: 1, max: 10, default: 5 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    factors: {
      categoryWeight: Number,
      keywordUrgency: Number,
      areaImpact: Number,
      reportedUrgency: Number
    }
  },
  
  // SLA
  sla: {
    targetHours: { type: Number, required: true },
    deadline: { type: Date, required: true, index: true },
    breached: { type: Boolean, default: false, index: true },
    breachedAt: Date,
    pausedAt: Date,
    pausedDuration: { type: Number, default: 0 }  // minutes
  },
  
  // Media
  images: [{
    url: { type: String, required: true },
    publicId: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now },
    type: { type: String, enum: ['before', 'after', 'evidence'], default: 'before' }
  }],
  voiceNote: {
    url: String,
    duration: Number,
    transcript: String
  },
  
  // Source
  source: {
    type: String,
    enum: ['mobile_app', 'web', 'whatsapp', 'voice', 'walk_in', 'phone'],
    default: 'mobile_app',
    index: true
  },
  
  // Duplicate Detection
  duplicate: {
    isDuplicate: { type: Boolean, default: false },
    parentComplaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    similarity: Number,
    linkedComplaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }]
  },
  
  // Resolution (separate model reference)
  resolutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resolution'
  },
  
  // Escalation (separate model reference)
  escalationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Escalation'
  },
  
  // AI Processing Metadata
  aiMetadata: {
    classificationTime: Number,
    duplicateCheckTime: Number,
    severityCalcTime: Number,
    processedAt: Date,
    modelVersion: String
  },
  
  // Audit
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    appVersion: String
  }
}, {
  timestamps: true
});

// Indexes
ComplaintSchema.index({ location: '2dsphere' });
ComplaintSchema.index({ 'status.current': 1, ucId: 1 });
ComplaintSchema.index({ 'status.current': 1, townId: 1 });
ComplaintSchema.index({ createdAt: -1 });
ComplaintSchema.index({ 'sla.deadline': 1, 'sla.breached': 1 });
ComplaintSchema.index({ 'category.primary': 1, 'status.current': 1 });
ComplaintSchema.index({ assignedTo: 1, 'status.current': 1 });
ComplaintSchema.index({ description: 'text', 'location.address': 'text' });

// Pre-save: Generate complaintId
ComplaintSchema.pre('save', async function(next) {
  if (this.isNew && !this.complaintId) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    this.complaintId = `CL-${date}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Pre-save: Calculate SLA deadline
ComplaintSchema.pre('save', function(next) {
  if (this.isNew && !this.sla.deadline) {
    const hours = this.sla.targetHours || 72;
    this.sla.deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  }
  next();
});

// Methods
ComplaintSchema.methods.transitionStatus = async function(newStatus, userId, role, remarks) {
  // Validate transition
  const validTransitions = {
    reported: ['assigned', 'rejected', 'escalated'],
    assigned: ['in_progress', 'escalated'],
    in_progress: ['resolved', 'escalated'],
    resolved: ['pending_verification'],
    pending_verification: ['verified', 'reopened'],
    verified: ['closed', 'reopened'],
    reopened: ['assigned', 'escalated'],
    escalated: ['assigned'],
    rejected: [],
    closed: ['reopened']
  };
  
  if (!validTransitions[this.status.current]?.includes(newStatus)) {
    throw new Error(`Invalid transition: ${this.status.current} → ${newStatus}`);
  }
  
  this.status.current = newStatus;
  this.status.history.push({
    status: newStatus,
    timestamp: new Date(),
    changedBy: userId,
    changedByRole: role,
    remarks
  });
  
  return this.save();
};

// Statics
ComplaintSchema.statics.findByUC = function(ucId, filters = {}) {
  return this.find({ ucId, ...filters });
};

ComplaintSchema.statics.findByTown = function(townId, filters = {}) {
  return this.find({ townId, ...filters });
};

ComplaintSchema.statics.findNearby = function(lng, lat, radiusMeters = 500) {
  return this.find({
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusMeters
      }
    }
  });
};
```

---

## 5.8 Assignment Model

**Purpose**: Tracks officer assignments with history.

```javascript
const AssignmentSchema = new mongoose.Schema({
  // References
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Assignment Details
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedByRole: {
    type: String,
    enum: ['uc_chairman', 'town_chairman', 'system'],
    required: true
  },
  
  // Timing
  assignedAt: { type: Date, default: Date.now },
  expectedCompletionAt: Date,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'reassigned', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Notes
  assignmentNotes: String,
  rejectionReason: String,
  completionNotes: String,
  
  // Sequence (for tracking reassignments)
  sequence: { type: Number, default: 1 },
  previousAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }
}, {
  timestamps: true
});

// Index for finding current assignment
AssignmentSchema.index({ complaintId: 1, status: 1 });
```

---

## 5.9 Resolution Model

**Purpose**: Detailed resolution information.

```javascript
const ResolutionSchema = new mongoose.Schema({
  // References
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    unique: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  
  // Resolution Details
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolvedAt: { type: Date, default: Date.now },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  actionTaken: {
    type: String,
    required: true
  },
  
  // Media
  afterImages: [{
    url: String,
    publicId: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Resources Used
  resourcesUsed: [{
    type: String,
    quantity: Number,
    unit: String,
    cost: Number
  }],
  estimatedCost: Number,
  
  // Verification
  verification: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    remarks: String
  },
  
  // Citizen Feedback
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    satisfied: Boolean,
    submittedAt: Date
  },
  
  // Metrics
  metrics: {
    totalHours: Number,
    slaCompliant: Boolean,
    reopenCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});
```

---

## 5.10 Escalation Model

**Purpose**: Tracks escalations to Town Chairman.

```javascript
const EscalationSchema = new mongoose.Schema({
  // References
  complaintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
    index: true
  },
  
  // Source
  fromUcId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UC',
    required: true
  },
  toTownId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Town',
    required: true,
    index: true
  },
  
  // Reason
  reason: {
    type: String,
    enum: [
      'sla_breach',
      'multiple_reopens',
      'citizen_escalation',
      'chairman_escalation',
      'resource_required',
      'cross_uc_issue',
      'sensitive_issue',
      'other'
    ],
    required: true
  },
  description: String,
  
  // Escalation Source
  escalatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalationType: {
    type: String,
    enum: ['automatic', 'manual'],
    required: true
  },
  
  // Timing
  escalatedAt: { type: Date, default: Date.now },
  acknowledgedAt: Date,
  resolvedAt: Date,
  
  // Resolution
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'transferred'],
    default: 'pending',
    index: true
  },
  resolution: {
    action: String,
    newAssigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transferredToUcId: { type: mongoose.Schema.Types.ObjectId, ref: 'UC' },
    remarks: String,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Sequence
  escalationLevel: { type: Number, default: 1 },
  previousEscalationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Escalation' }
}, {
  timestamps: true
});
```

---

## 5.11 AuditLog Model

**Purpose**: System-wide audit trail.

```javascript
const AuditLogSchema = new mongoose.Schema({
  // Action
  action: {
    type: String,
    required: true,
    enum: [
      'complaint.created',
      'complaint.assigned',
      'complaint.status_changed',
      'complaint.resolved',
      'complaint.verified',
      'complaint.closed',
      'complaint.escalated',
      'complaint.reopened',
      'user.created',
      'user.role_changed',
      'user.status_changed',
      'uc.chairman_assigned',
      'uc.officer_added',
      'town.chairman_assigned',
      'system.sla_breach',
      'system.auto_escalation'
    ],
    index: true
  },
  
  // Actor
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  actorRole: String,
  actorName: String,
  
  // Target
  targetType: {
    type: String,
    enum: ['complaint', 'user', 'uc', 'town', 'department', 'system']
  },
  targetId: mongoose.Schema.Types.ObjectId,
  
  // Context
  ucId: { type: mongoose.Schema.Types.ObjectId, ref: 'UC', index: true },
  townId: { type: mongoose.Schema.Types.ObjectId, ref: 'Town', index: true },
  
  // Details
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Request Info
  ipAddress: String,
  userAgent: String,
  
  // Timestamp
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false  // We have our own timestamp
});

// TTL index: Keep logs for 2 years
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });
```

---

## 5.12 WhatsAppSession Model (Existing, Enhanced)

```javascript
const WhatsAppSessionSchema = new mongoose.Schema({
  // Identity
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // User Link
  phone: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  
  // Session State
  status: {
    type: String,
    enum: ['active', 'expired', 'pending', 'blocked'],
    default: 'pending'
  },
  
  // Conversation Context
  conversationState: {
    type: String,
    enum: ['idle', 'collecting_description', 'collecting_location', 'collecting_image', 'confirming', 'complete'],
    default: 'idle'
  },
  pendingComplaint: {
    description: String,
    location: {
      lat: Number,
      lng: Number
    },
    images: [String],
    step: String
  },
  
  // Baileys Auth
  creds: mongoose.Schema.Types.Mixed,
  
  // Activity
  lastMessageAt: Date,
  lastSyncAt: Date,
  messageCount: { type: Number, default: 0 },
  
  // Device Info
  deviceInfo: {
    platform: String,
    deviceModel: String,
    osVersion: String
  }
}, {
  timestamps: true
});
```

---

## 5.13 Model Relationships Summary

```
Town (1) ──────────────────────── (M) UC
  │                                   │
  │ townChairmanId                    │ ucChairmanId
  ▼                                   ▼
User ◄─────────────────────────────── User
  │                                   │
  │ (town_chairman)                   │ (uc_chairman)
  │                                   │
  │                                   │ (manages)
  │                                   ▼
  │                                 User (officer)
  │                                   │
  │                                   │ assignedTo
  │                                   ▼
  └──────────────────────────────▶ Complaint
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              Assignment         Resolution        Escalation
                    │                 │                 │
                    └────────────────┴─────────────────┘
                                      │
                                      ▼
                                  AuditLog
```

---

# 6. Backend Architecture

## 6.1 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── env.js                # Environment variables
│   │   ├── redis.js              # Redis connection (caching/queues)
│   │   └── constants.js          # App-wide constants
│   │
│   ├── models/
│   │   ├── index.js              # Model exports
│   │   ├── Town.js
│   │   ├── UC.js
│   │   ├── Department.js
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Complaint.js
│   │   ├── Assignment.js
│   │   ├── Resolution.js
│   │   ├── Escalation.js
│   │   ├── AuditLog.js
│   │   └── WhatsAppSession.js
│   │
│   ├── routes/
│   │   ├── index.js              # Route aggregator
│   │   ├── auth.routes.js        # Authentication
│   │   ├── citizen.routes.js     # Citizen endpoints
│   │   ├── officer.routes.js     # Officer endpoints
│   │   ├── ucChairman.routes.js  # UC Chairman endpoints
│   │   ├── townChairman.routes.js# Town Chairman endpoints
│   │   ├── admin.routes.js       # Admin endpoints
│   │   ├── complaint.routes.js   # Complaint CRUD
│   │   ├── category.routes.js    # Categories
│   │   ├── analytics.routes.js   # Stats & reports
│   │   ├── voice.routes.js       # Voice complaints
│   │   └── webhook.routes.js     # External webhooks
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── citizen.controller.js
│   │   ├── officer.controller.js
│   │   ├── ucChairman.controller.js
│   │   ├── townChairman.controller.js
│   │   ├── admin.controller.js
│   │   ├── complaint.controller.js
│   │   ├── category.controller.js
│   │   ├── analytics.controller.js
│   │   └── voice.controller.js
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   ├── auth.service.js
│   │   │   ├── otp.service.js
│   │   │   └── token.service.js
│   │   │
│   │   ├── complaint/
│   │   │   ├── complaint.service.js
│   │   │   ├── assignment.service.js
│   │   │   ├── resolution.service.js
│   │   │   └── escalation.service.js
│   │   │
│   │   ├── ai/
│   │   │   ├── classification.service.js
│   │   │   ├── duplicate.service.js
│   │   │   ├── severity.service.js
│   │   │   └── speech.service.js
│   │   │
│   │   ├── geo/
│   │   │   ├── geocoding.service.js
│   │   │   ├── routing.service.js   # UC routing
│   │   │   └── boundary.service.js
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.service.js
│   │   │   ├── sms.service.js
│   │   │   ├── push.service.js
│   │   │   ├── email.service.js
│   │   │   └── whatsapp.service.js
│   │   │
│   │   ├── analytics/
│   │   │   ├── stats.service.js
│   │   │   ├── reports.service.js
│   │   │   └── export.service.js
│   │   │
│   │   └── external/
│   │       ├── cloudinary.service.js
│   │       └── groq.service.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── role.middleware.js        # Role-based access
│   │   ├── uc.middleware.js          # UC-scoped access
│   │   ├── town.middleware.js        # Town-scoped access
│   │   ├── validate.middleware.js    # Request validation
│   │   ├── upload.middleware.js      # File uploads
│   │   ├── rateLimit.middleware.js   # Rate limiting
│   │   ├── audit.middleware.js       # Audit logging
│   │   └── error.middleware.js       # Error handling
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── complaint.validator.js
│   │   ├── user.validator.js
│   │   └── common.validator.js
│   │
│   ├── jobs/
│   │   ├── sla.job.js               # SLA breach detection
│   │   ├── escalation.job.js        # Auto-escalation
│   │   ├── notification.job.js      # Notification queue
│   │   ├── stats.job.js             # Stats aggregation
│   │   └── cleanup.job.js           # Data cleanup
│   │
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── logger.js
│   │   ├── response.js
│   │   ├── pagination.js
│   │   └── crypto.js
│   │
│   ├── whatsapp/
│   │   ├── bot.js                   # WhatsApp bot main
│   │   ├── handlers/
│   │   │   ├── message.handler.js
│   │   │   ├── location.handler.js
│   │   │   └── media.handler.js
│   │   └── flows/
│   │       ├── complaint.flow.js
│   │       └── status.flow.js
│   │
│   ├── app.js                       # Express app setup
│   └── server.js                    # Server entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── scripts/
│   ├── seed.js                      # Database seeding
│   ├── migrate.js                   # Migrations
│   └── boundary-import.js           # Import UC/Town boundaries
│
├── .env.example
├── package.json
└── README.md
```

## 6.2 Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        COMPLAINT SERVICE                               │  │
│  │                                                                        │  │
│  │   createComplaint()                                                    │  │
│  │   ├── geoRoutingService.routeToUC()                                   │  │
│  │   ├── classificationService.classify()                                │  │
│  │   ├── duplicateService.check()                                        │  │
│  │   ├── severityService.calculate()                                     │  │
│  │   ├── cloudinaryService.uploadImages()                                │  │
│  │   ├── Complaint.create()                                              │  │
│  │   ├── notificationService.notifyUCChairman()                          │  │
│  │   └── auditService.log()                                              │  │
│  │                                                                        │  │
│  │   assignToOfficer()                                                    │  │
│  │   ├── Assignment.create()                                             │  │
│  │   ├── Complaint.updateStatus()                                        │  │
│  │   ├── notificationService.notifyOfficer()                             │  │
│  │   └── auditService.log()                                              │  │
│  │                                                                        │  │
│  │   resolveComplaint()                                                   │  │
│  │   ├── Resolution.create()                                             │  │
│  │   ├── Complaint.updateStatus()                                        │  │
│  │   ├── notificationService.notifyChairman()                            │  │
│  │   └── auditService.log()                                              │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      ESCALATION SERVICE                                │  │
│  │                                                                        │  │
│  │   checkSLABreaches() [CRON]                                           │  │
│  │   ├── Find complaints past SLA                                        │  │
│  │   ├── Create Escalation records                                       │  │
│  │   ├── Update Complaint status                                         │  │
│  │   ├── Notify Town Chairman                                            │  │
│  │   └── Log to audit                                                    │  │
│  │                                                                        │  │
│  │   escalateManually()                                                   │  │
│  │   resolveEscalation()                                                  │  │
│  │   transferToUC()                                                       │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6.3 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/send-otp` | Send OTP to phone | Public |
| POST | `/auth/verify-otp` | Verify OTP, get token | Public |
| POST | `/auth/refresh` | Refresh access token | Authenticated |
| POST | `/auth/logout` | Invalidate token | Authenticated |
| GET | `/auth/me` | Get current user | Authenticated |

### Citizen Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/citizen/complaints` | Submit complaint |
| GET | `/citizen/complaints` | Get own complaints |
| GET | `/citizen/complaints/:id` | Get complaint details |
| POST | `/citizen/complaints/:id/feedback` | Submit feedback |
| POST | `/citizen/complaints/:id/reopen` | Reopen complaint |

### Officer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/officer/assignments` | Get assigned complaints |
| GET | `/officer/assignments/:id` | Get assignment details |
| POST | `/officer/assignments/:id/accept` | Accept assignment |
| POST | `/officer/assignments/:id/start` | Start working |
| POST | `/officer/assignments/:id/resolve` | Submit resolution |
| GET | `/officer/stats` | Get own stats |

### UC Chairman Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/uc/complaints` | Get UC complaints |
| GET | `/uc/complaints/:id` | Get complaint details |
| POST | `/uc/complaints/:id/assign` | Assign to officer |
| POST | `/uc/complaints/:id/verify` | Verify resolution |
| POST | `/uc/complaints/:id/reject` | Reject resolution |
| POST | `/uc/complaints/:id/escalate` | Escalate to Town |
| GET | `/uc/officers` | Get UC officers |
| GET | `/uc/stats` | Get UC statistics |
| GET | `/uc/analytics` | Get UC analytics |

### Town Chairman Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/town/complaints` | Get Town complaints |
| GET | `/town/escalations` | Get escalated complaints |
| POST | `/town/escalations/:id/resolve` | Resolve escalation |
| POST | `/town/escalations/:id/transfer` | Transfer to UC |
| GET | `/town/ucs` | Get all UCs |
| GET | `/town/ucs/:id/stats` | Get UC stats |
| POST | `/town/ucs/:id/chairman` | Assign UC Chairman |
| GET | `/town/officers` | Get all officers |
| GET | `/town/stats` | Get Town statistics |
| GET | `/town/analytics` | Get Town analytics |
| GET | `/town/reports` | Generate reports |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | Get all users |
| POST | `/admin/users` | Create user |
| PATCH | `/admin/users/:id` | Update user |
| GET | `/admin/towns` | Get all towns |
| POST | `/admin/towns` | Create town |
| GET | `/admin/ucs` | Get all UCs |
| POST | `/admin/ucs` | Create UC |
| GET | `/admin/departments` | Get departments |
| POST | `/admin/departments` | Create department |
| GET | `/admin/categories` | Get categories |
| POST | `/admin/categories/seed` | Seed categories |
| GET | `/admin/audit-logs` | Get audit logs |
| GET | `/admin/system/stats` | System statistics |

## 6.4 Cron Jobs

```javascript
// jobs/sla.job.js
const cron = require('node-cron');

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  // 1. Find complaints past SLA deadline
  const breached = await Complaint.find({
    'sla.breached': false,
    'sla.deadline': { $lt: new Date() },
    'status.current': { $nin: ['closed', 'rejected', 'escalated'] }
  });
  
  // 2. Mark as breached
  for (const complaint of breached) {
    complaint.sla.breached = true;
    complaint.sla.breachedAt = new Date();
    await complaint.save();
    
    // 3. Create escalation
    await Escalation.create({
      complaintId: complaint._id,
      fromUcId: complaint.ucId,
      toTownId: complaint.townId,
      reason: 'sla_breach',
      escalationType: 'automatic'
    });
    
    // 4. Update status
    await complaint.transitionStatus('escalated', null, 'system', 'SLA breached - auto-escalated');
    
    // 5. Notify
    await notificationService.notifyTownChairman(complaint.townId, {
      type: 'sla_breach',
      complaintId: complaint.complaintId
    });
  }
});

// Run every hour: Reminder notifications
cron.schedule('0 * * * *', async () => {
  // Find complaints at 50% and 75% SLA
  const now = new Date();
  
  // 50% warning
  const halfwayComplaints = await Complaint.find({
    'status.current': 'reported',
    'sla.deadline': {
      $gte: now,
      $lte: new Date(now.getTime() + (complaint.sla.targetHours / 2) * 3600000)
    }
  });
  
  // Notify UC Chairman
  for (const complaint of halfwayComplaints) {
    await notificationService.notifyUCChairman(complaint.ucId, {
      type: 'sla_warning_50',
      complaintId: complaint.complaintId
    });
  }
});

// Run daily at midnight: Stats aggregation
cron.schedule('0 0 * * *', async () => {
  // Aggregate UC stats
  const ucs = await UC.find({ status: 'active' });
  
  for (const uc of ucs) {
    const stats = await Complaint.aggregate([
      { $match: { ucId: uc._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: {
            $sum: {
              $cond: [
                { $in: ['$status.current', ['reported', 'assigned', 'in_progress']] },
                1,
                0
              ]
            }
          },
          resolved: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status.current', ['closed', 'verified']] },
                    { $gte: ['$updatedAt', new Date(Date.now() - 30 * 24 * 3600000)] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    uc.stats = {
      totalComplaints: stats[0]?.total || 0,
      openComplaints: stats[0]?.open || 0,
      resolvedLast30Days: stats[0]?.resolved || 0
    };
    
    await uc.save();
  }
});
```

## 6.5 Notification Service

```javascript
// services/notification/notification.service.js

class NotificationService {
  async notify(userId, notification) {
    const user = await User.findById(userId);
    if (!user) return;
    
    const channels = [];
    
    // Always try push notification
    if (user.deviceTokens?.length > 0) {
      channels.push(this.sendPush(user.deviceTokens, notification));
    }
    
    // SMS for critical notifications
    if (notification.priority === 'critical' && user.phone) {
      channels.push(this.sendSMS(user.phone, notification));
    }
    
    // Email if available
    if (user.email) {
      channels.push(this.sendEmail(user.email, notification));
    }
    
    await Promise.allSettled(channels);
  }
  
  async notifyUCChairman(ucId, notification) {
    const uc = await UC.findById(ucId).populate('chairmanId');
    if (uc?.chairmanId) {
      await this.notify(uc.chairmanId._id, notification);
    }
  }
  
  async notifyTownChairman(townId, notification) {
    const town = await Town.findById(townId).populate('chairmanId');
    if (town?.chairmanId) {
      await this.notify(town.chairmanId._id, {
        ...notification,
        priority: 'critical'
      });
    }
  }
  
  async notifyOfficer(officerId, notification) {
    await this.notify(officerId, notification);
  }
  
  async notifyCitizen(complaintId, notification) {
    const complaint = await Complaint.findById(complaintId);
    if (complaint?.citizen?.userId) {
      await this.notify(complaint.citizen.userId, notification);
    }
    // Also send SMS to phone
    if (complaint?.citizen?.phone) {
      await this.sendSMS(complaint.citizen.phone, notification);
    }
  }
}
```

---

# 7. Frontend Architecture

## 7.1 Application Split

CivicLens requires **4 separate frontend applications**:

| App | Users | Platform | Priority |
|-----|-------|----------|----------|
| Citizen App | Citizens | Mobile (React Native) + Web | P0 |
| Officer App | Officers | Mobile (React Native) | P1 |
| UC Dashboard | UC Chairmen | Web (React) | P0 |
| Town Dashboard | Town Chairmen | Web (React) | P1 |
| Admin Panel | Admins | Web (React) | P2 |

## 7.2 Citizen App

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Onboarding | `/onboarding` | First-time user flow |
| Login | `/login` | Phone + OTP login |
| Home | `/` | Quick actions, recent complaints |
| New Complaint | `/complaints/new` | Multi-step form |
| My Complaints | `/complaints` | List of own complaints |
| Complaint Detail | `/complaints/:id` | Status, timeline, feedback |
| Feedback | `/complaints/:id/feedback` | Rating and comment |
| Profile | `/profile` | User info, settings |

### Key Components

```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Toast.jsx
│   │   └── LoadingSpinner.jsx
│   │
│   ├── complaint/
│   │   ├── ComplaintCard.jsx        # Summary card
│   │   ├── ComplaintTimeline.jsx    # Status history
│   │   ├── ComplaintForm.jsx        # Multi-step form
│   │   ├── LocationPicker.jsx       # Map with pin
│   │   ├── ImageUploader.jsx        # Camera + gallery
│   │   ├── CategorySelector.jsx     # Category pills
│   │   └── VoiceRecorder.jsx        # Voice input
│   │
│   ├── feedback/
│   │   ├── StarRating.jsx
│   │   └── FeedbackForm.jsx
│   │
│   └── layout/
│       ├── Header.jsx
│       ├── BottomNav.jsx
│       └── SafeAreaView.jsx
│
├── screens/
│   ├── OnboardingScreen.jsx
│   ├── LoginScreen.jsx
│   ├── HomeScreen.jsx
│   ├── NewComplaintScreen.jsx
│   ├── ComplaintsListScreen.jsx
│   ├── ComplaintDetailScreen.jsx
│   ├── FeedbackScreen.jsx
│   └── ProfileScreen.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useComplaints.js
│   ├── useLocation.js
│   └── useNotifications.js
│
├── services/
│   ├── api.js
│   ├── auth.service.js
│   ├── complaint.service.js
│   └── storage.service.js
│
├── store/
│   ├── authSlice.js
│   ├── complaintsSlice.js
│   └── store.js
│
└── utils/
    ├── constants.js
    ├── helpers.js
    └── validators.js
```

### UX Priorities

1. **Fast complaint submission** - Under 60 seconds
2. **Location accuracy** - GPS with manual override
3. **Offline support** - Queue submissions
4. **Status visibility** - Clear timeline
5. **Simple feedback** - One-tap rating

### New Complaint Flow

```
Step 1: Location
├── Auto-detect GPS
├── Show on map
├── Allow manual adjustment
└── "Confirm Location" button

Step 2: Description
├── Text input OR
├── Voice recording
├── Auto-transcription
└── "Next" button

Step 3: Photos (Optional)
├── Camera capture
├── Gallery select
├── Up to 5 images
└── "Next" / "Skip" buttons

Step 4: Contact
├── Phone (required, pre-filled if logged in)
├── Name (optional)
└── "Submit" button

Step 5: Confirmation
├── Complaint ID shown
├── Estimated resolution time
├── "Track Complaint" button
└── "Submit Another" button
```

## 7.3 UC Chairman Dashboard

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Phone + OTP |
| Dashboard | `/` | Overview, stats, alerts |
| Complaints | `/complaints` | All UC complaints |
| Complaint Detail | `/complaints/:id` | Full details, actions |
| Assign | `/complaints/:id/assign` | Officer assignment |
| Officers | `/officers` | Officer list, performance |
| Analytics | `/analytics` | Charts, trends |
| Settings | `/settings` | Profile, notifications |

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR           │                    MAIN CONTENT                        │
│                    │                                                         │
│  ┌──────────────┐  │  ┌─────────────────────────────────────────────────┐   │
│  │ 🏠 Dashboard │  │  │                  HEADER                          │   │
│  ├──────────────┤  │  │  UC-0042 Gulberg    │  🔔 5  │  👤 Chairman     │   │
│  │ 📋 Complaints│  │  └─────────────────────────────────────────────────┘   │
│  │   New (12)   │  │                                                         │
│  │   Pending(8) │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │   Verify (5) │  │  │  Open   │ │Assigned │ │Resolved │ │ Closed  │       │
│  ├──────────────┤  │  │   34    │ │   28    │ │   12    │ │   156   │       │
│  │ 👥 Officers  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│  ├──────────────┤  │                                                         │
│  │ 📊 Analytics │  │  ┌─────────────────────────────────────────────────┐   │
│  ├──────────────┤  │  │           NEEDS ATTENTION                        │   │
│  │ ⚙️ Settings  │  │  │                                                  │   │
│  └──────────────┘  │  │  • 5 complaints need assignment                  │   │
│                    │  │  • 3 resolutions pending verification            │   │
│                    │  │  • 2 SLA warnings (75% elapsed)                  │   │
│                    │  │                                                  │   │
│                    │  └─────────────────────────────────────────────────┘   │
│                    │                                                         │
│                    │  ┌─────────────────────────────────────────────────┐   │
│                    │  │           RECENT COMPLAINTS                      │   │
│                    │  │  ┌───┬────────────┬─────────┬────────┬───────┐  │   │
│                    │  │  │ # │ Description│ Category│ Status │ Action│  │   │
│                    │  │  ├───┼────────────┼─────────┼────────┼───────┤  │   │
│                    │  │  │...│ ...        │ ...     │ ...    │ Assign│  │   │
│                    │  │  └───┴────────────┴─────────┴────────┴───────┘  │   │
│                    │  └─────────────────────────────────────────────────┘   │
│                    │                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

```
src/
├── components/
│   ├── dashboard/
│   │   ├── StatCard.jsx
│   │   ├── AlertBanner.jsx
│   │   ├── ActivityFeed.jsx
│   │   └── QuickActions.jsx
│   │
│   ├── complaints/
│   │   ├── ComplaintTable.jsx
│   │   ├── ComplaintFilters.jsx
│   │   ├── ComplaintDetail.jsx
│   │   ├── AssignmentModal.jsx
│   │   ├── VerificationModal.jsx
│   │   ├── EscalationModal.jsx
│   │   └── ComplaintMap.jsx
│   │
│   ├── officers/
│   │   ├── OfficerTable.jsx
│   │   ├── OfficerCard.jsx
│   │   └── PerformanceChart.jsx
│   │
│   ├── analytics/
│   │   ├── CategoryChart.jsx
│   │   ├── TrendChart.jsx
│   │   ├── HeatMap.jsx
│   │   └── SLAChart.jsx
│   │
│   └── layout/
│       ├── Sidebar.jsx
│       ├── Header.jsx
│       ├── Breadcrumb.jsx
│       └── PageContainer.jsx
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Complaints.jsx
│   ├── ComplaintDetail.jsx
│   ├── Officers.jsx
│   ├── Analytics.jsx
│   └── Settings.jsx
│
└── hooks/
    ├── useComplaints.js
    ├── useOfficers.js
    ├── useAnalytics.js
    └── useWebSocket.js   # Real-time updates
```

## 7.4 Town Chairman Dashboard

### Additional Pages (Beyond UC Dashboard)

| Page | Route | Description |
|------|-------|-------------|
| UCs Overview | `/ucs` | All UCs with stats |
| UC Detail | `/ucs/:id` | Single UC deep dive |
| Escalations | `/escalations` | Escalated complaints |
| Escalation Detail | `/escalations/:id` | Resolve/transfer |
| UC Chairmen | `/chairmen` | Manage UC Chairmen |
| Town Analytics | `/analytics` | Town-wide analytics |
| Reports | `/reports` | Generate reports |

### Dashboard Differences

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOWN CHAIRMAN DASHBOARD                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TOP SECTION: Town-wide Stats                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Total    │ │ Open     │ │Escalated │ │ SLA      │ │ Citizen  │           │
│  │ 1,234    │ │   189    │ │    12    │ │ 94.2%    │ │ 4.2 ⭐   │           │
│  │complaints│ │          │ │ ⚠️       │ │compliance│ │ rating   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                              │
│  UC COMPARISON SECTION:                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ UC Name      │ Open │ Resolved │ SLA % │ Avg Time │ Rating │ Action │    │
│  ├──────────────┼──────┼──────────┼───────┼──────────┼────────┼────────┤    │
│  │ UC-0042      │  34  │    156   │  96%  │  18h     │  4.5   │ View   │    │
│  │ UC-0043      │  28  │    142   │  89%  │  24h     │  4.1   │ View   │    │
│  │ UC-0044 ⚠️   │  45  │     98   │  72%  │  42h     │  3.2   │ View   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ESCALATIONS SECTION:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 🚨 12 escalations require your attention                            │    │
│  │                                                                      │    │
│  │ • CL-20260128-00234 - SLA breach (UC-0044) - 2h ago                 │    │
│  │ • CL-20260128-00189 - Multiple reopens (UC-0042) - 4h ago           │    │
│  │ • CL-20260127-00456 - Resource required (UC-0043) - 1d ago          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 7.5 Admin Panel

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | System health, stats |
| Users | `/users` | User management |
| Towns | `/towns` | Town management |
| UCs | `/ucs` | UC management |
| Departments | `/departments` | Department config |
| Categories | `/categories` | Category config |
| Audit Logs | `/audit` | System audit trail |
| Settings | `/settings` | System settings |

### Focus

- User creation and role assignment
- Geographic boundary management
- Category and SLA configuration
- System monitoring
- Audit log review

## 7.6 Shared Component Library

Create a shared component library (`@civiclens/ui`) for consistency:

```
packages/ui/
├── components/
│   ├── Button/
│   ├── Input/
│   ├── Select/
│   ├── Table/
│   ├── Modal/
│   ├── Card/
│   ├── Badge/
│   ├── Avatar/
│   ├── Tabs/
│   ├── Pagination/
│   ├── DatePicker/
│   ├── Map/
│   └── Charts/
│
├── hooks/
│   ├── useToast.js
│   ├── useModal.js
│   └── useForm.js
│
├── utils/
│   ├── formatters.js
│   ├── validators.js
│   └── colors.js
│
└── theme/
    ├── colors.js
    ├── typography.js
    └── spacing.js
```

---

# 8. AI & Automation

## 8.1 Classification Pipeline

### Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLASSIFICATION PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: complaint.description                                                │
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   PREPROCESS │────▶│  GROQ LLM    │────▶│   VALIDATE   │                 │
│  │   - lowercase│     │  (primary)   │     │   - schema   │                 │
│  │   - normalize│     │              │     │   - enum     │                 │
│  └──────────────┘     └──────┬───────┘     └──────┬───────┘                 │
│                              │                     │                         │
│                              │ FAIL                │ SUCCESS                 │
│                              ▼                     ▼                         │
│                       ┌──────────────┐     ┌──────────────┐                 │
│                       │ LOCAL TF-IDF │     │   RETURN     │                 │
│                       │  (fallback)  │     │   RESULT     │                 │
│                       └──────────────┘     └──────────────┘                 │
│                                                                              │
│  OUTPUT: {                                                                   │
│    category: "Roads",                                                        │
│    subcategory: "pothole",                                                   │
│    confidence: 0.92,                                                         │
│    urgency: "high",                                                          │
│    keywords: ["pothole", "road", "dangerous"],                              │
│    needsReview: false                                                        │
│  }                                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```javascript
// services/ai/classification.service.js

const GROQ_PROMPT = `You are a municipal complaint classifier for Pakistan.

Classify this complaint into ONE category:
- Roads: potholes, street lights, traffic signals, footpaths, road damage
- Water: supply issues, leaks, drainage, sewage, waterlogging
- Garbage: waste collection, dumping, cleanliness, bins
- Electricity: power outage, street lights, wires, transformers
- Sanitation: public toilets, open defecation, hygiene
- Others: anything else

Also determine:
- subcategory: specific issue type
- urgency: low/medium/high/critical
- keywords: 3-5 relevant words

Respond in JSON only:
{
  "category": "Roads",
  "subcategory": "pothole",
  "confidence": 0.9,
  "urgency": "high",
  "keywords": ["pothole", "road", "broken"]
}`;

async function classify(description) {
  // 1. Check cache
  const cacheKey = hash(description.toLowerCase().trim());
  const cached = await cache.get(`classify:${cacheKey}`);
  if (cached) return cached;
  
  let result;
  
  // 2. Try GROQ
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: GROQ_PROMPT },
        { role: 'user', content: description }
      ],
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });
    
    result = JSON.parse(response.choices[0].message.content);
    result.source = 'groq';
    
    // Validate
    if (!VALID_CATEGORIES.includes(result.category)) {
      throw new Error('Invalid category');
    }
  } catch (error) {
    // 3. Fallback to local
    result = classifyLocal(description);
    result.source = 'local';
  }
  
  // 4. Add needsReview flag
  result.needsReview = result.confidence < 0.6;
  
  // 5. Cache
  await cache.set(`classify:${cacheKey}`, result, 3600);
  
  return result;
}
```

## 8.2 Severity Scoring

### Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Category Base | 0.3 | Electricity = 8, Water = 7, Roads = 6, Garbage = 5, Others = 4 |
| Urgency Keywords | 0.25 | "dangerous", "children", "elderly" = boost |
| Area Density | 0.2 | Complaints/km² in last 30 days |
| Reported Urgency | 0.15 | Citizen-indicated urgency |
| Time Sensitivity | 0.1 | Monsoon + Water = boost |

### Implementation

```javascript
function calculateSeverity(complaint) {
  const factors = {};
  
  // Category base score (1-10)
  const categoryScores = {
    Electricity: 8,
    Water: 7,
    Roads: 6,
    Garbage: 5,
    Sanitation: 5,
    Others: 4
  };
  factors.categoryWeight = categoryScores[complaint.category.primary] || 5;
  
  // Keyword urgency
  const urgentKeywords = ['dangerous', 'hazard', 'children', 'elderly', 'hospital', 'school', 'emergency'];
  const description = complaint.description.toLowerCase();
  factors.keywordUrgency = urgentKeywords.filter(k => description.includes(k)).length * 2;
  
  // Area impact (complaints in same area)
  const nearbyCount = await countNearbyComplaints(
    complaint.location.coordinates,
    1000, // 1km
    30    // last 30 days
  );
  factors.areaImpact = Math.min(nearbyCount / 5, 3); // Max 3 points
  
  // Reported urgency
  const urgencyScores = { critical: 3, high: 2, medium: 1, low: 0 };
  factors.reportedUrgency = urgencyScores[complaint.category.urgency] || 1;
  
  // Calculate final score
  const score = Math.min(10, Math.max(1,
    factors.categoryWeight * 0.3 +
    factors.keywordUrgency * 0.25 +
    factors.areaImpact * 0.2 +
    factors.reportedUrgency * 0.15 +
    5 * 0.1 // base
  ));
  
  // Determine priority
  let priority;
  if (score >= 8) priority = 'critical';
  else if (score >= 6) priority = 'high';
  else if (score >= 4) priority = 'medium';
  else priority = 'low';
  
  return { score: Math.round(score * 10) / 10, priority, factors };
}
```

## 8.3 Duplicate Detection

### Logic

```javascript
async function checkDuplicates(complaint) {
  // 1. Find nearby complaints (same category, last 7 days, 500m radius)
  const nearby = await Complaint.find({
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: complaint.location.coordinates
        },
        $maxDistance: 500
      }
    },
    'category.primary': complaint.category.primary,
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600000) },
    'status.current': { $nin: ['closed', 'rejected'] }
  }).limit(10);
  
  if (nearby.length === 0) {
    return { isDuplicate: false, nearbyCount: 0 };
  }
  
  // 2. Calculate text similarity
  const inputText = preprocess(complaint.description);
  
  for (const existing of nearby) {
    const similarity = calculateSimilarity(inputText, preprocess(existing.description));
    
    if (similarity > 0.7) {
      return {
        isDuplicate: true,
        parentComplaintId: existing._id,
        similarity,
        nearbyCount: nearby.length
      };
    }
  }
  
  return {
    isDuplicate: false,
    nearbyCount: nearby.length,
    similarComplaints: nearby.map(c => c.complaintId)
  };
}

function calculateSimilarity(text1, text2) {
  // TF-IDF + Cosine similarity
  const tfidf = new TfIdf();
  tfidf.addDocument(text1);
  tfidf.addDocument(text2);
  
  // Get term vectors
  const terms = new Set([...tokenize(text1), ...tokenize(text2)]);
  const vec1 = Array.from(terms).map(t => tfidf.tfidf(t, 0));
  const vec2 = Array.from(terms).map(t => tfidf.tfidf(t, 1));
  
  // Cosine similarity
  const dot = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  
  return dot / (mag1 * mag2) || 0;
}
```

## 8.4 Escalation Triggers

| Trigger | Condition | Action |
|---------|-----------|--------|
| SLA Breach | `now > sla.deadline && status != closed` | Auto-escalate to Town |
| No Assignment | `status == reported && age > 24h` | Notify UC Chairman |
| Assignment Timeout | `status == assigned && age > 48h` | Notify UC + Town |
| Multiple Reopens | `reopen_count >= 2` | Auto-escalate to Town |
| Citizen Escalation | Citizen requests escalation | Create escalation |
| High Severity | `severity.score >= 9 && age > 4h` | Notify Town Chairman |

## 8.5 SLA Breach Detection

```javascript
// Runs every 15 minutes via cron

async function detectSLABreaches() {
  const now = new Date();
  
  // Find breached complaints
  const breached = await Complaint.find({
    'sla.breached': false,
    'sla.deadline': { $lt: now },
    'status.current': { 
      $in: ['reported', 'assigned', 'in_progress', 'resolved', 'pending_verification'] 
    }
  });
  
  for (const complaint of breached) {
    // Mark as breached
    complaint.sla.breached = true;
    complaint.sla.breachedAt = now;
    
    // Create escalation
    await Escalation.create({
      complaintId: complaint._id,
      fromUcId: complaint.ucId,
      toTownId: complaint.townId,
      reason: 'sla_breach',
      escalationType: 'automatic',
      description: `SLA breached. Deadline was ${complaint.sla.deadline.toISOString()}`
    });
    
    // Update status
    complaint.status.current = 'escalated';
    complaint.status.history.push({
      status: 'escalated',
      timestamp: now,
      changedByRole: 'system',
      remarks: 'Auto-escalated due to SLA breach'
    });
    
    await complaint.save();
    
    // Notify
    await notificationService.notifyTownChairman(complaint.townId, {
      type: 'sla_breach',
      complaintId: complaint.complaintId,
      message: `Complaint ${complaint.complaintId} has breached SLA`,
      priority: 'critical'
    });
    
    // Audit log
    await AuditLog.create({
      action: 'system.sla_breach',
      targetType: 'complaint',
      targetId: complaint._id,
      ucId: complaint.ucId,
      townId: complaint.townId,
      metadata: {
        deadline: complaint.sla.deadline,
        breachedAt: now,
        status: complaint.status.current
      }
    });
  }
  
  return { breachedCount: breached.length };
}
```

---

# 9. Scalability & Governance

## 9.1 Start Small, Scale Up

### Phase 1: Single Town Pilot

```
1 Town
├── 10-15 UCs
├── 50-100 Officers
├── ~200,000 population
├── Expected: 100-500 complaints/day
└── Infrastructure: Single server, MongoDB Atlas M10
```

### Phase 2: District Expansion

```
1 District
├── 5-10 Towns
├── 50-100 UCs
├── 500-1000 Officers
├── ~2,000,000 population
├── Expected: 1,000-5,000 complaints/day
└── Infrastructure: Load balancer, MongoDB Atlas M30, Redis
```

### Phase 3: Provincial Scale

```
1 Province
├── 50+ Districts
├── 500+ Towns
├── 5,000+ UCs
├── 50,000+ Officers
├── ~100,000,000 population
├── Expected: 50,000+ complaints/day
└── Infrastructure: Kubernetes, MongoDB sharding, CDN
```

## 9.2 Data Isolation

### Multi-Tenancy Model

```javascript
// All queries MUST include townId or ucId filter

// Middleware for UC-scoped access
const ucScopeMiddleware = async (req, res, next) => {
  const user = req.user;
  
  if (user.role === 'officer' || user.role === 'uc_chairman') {
    req.ucId = user.ucId;
    req.townId = user.townId;
  }
  
  next();
};

// Middleware for Town-scoped access
const townScopeMiddleware = async (req, res, next) => {
  const user = req.user;
  
  if (user.role === 'town_chairman') {
    req.townId = user.townId;
    // Can access all UCs in town
    const ucs = await UC.find({ townId: user.townId });
    req.allowedUcIds = ucs.map(uc => uc._id);
  }
  
  next();
};

// Example query with scope
async function getComplaints(req) {
  const query = {};
  
  if (req.ucId) {
    query.ucId = req.ucId;  // UC-scoped
  } else if (req.townId) {
    query.townId = req.townId;  // Town-scoped
  }
  
  return Complaint.find(query);
}
```

### Database Indexes for Scoping

```javascript
// All complaint queries filtered by UC or Town
ComplaintSchema.index({ ucId: 1, 'status.current': 1 });
ComplaintSchema.index({ townId: 1, 'status.current': 1 });
ComplaintSchema.index({ ucId: 1, createdAt: -1 });
ComplaintSchema.index({ townId: 1, createdAt: -1 });
```

## 9.3 Reporting for Government & NGOs

### Report Types

| Report | Audience | Frequency | Content |
|--------|----------|-----------|---------|
| UC Daily | UC Chairman | Daily | New, resolved, pending |
| UC Weekly | UC Chairman | Weekly | Trends, SLA, officer performance |
| Town Weekly | Town Chairman | Weekly | UC comparison, escalations |
| Town Monthly | District | Monthly | Town performance, resource needs |
| Public Dashboard | NGOs, Citizens | Real-time | Anonymized stats, trends |

### Public Analytics API

```javascript
// Public endpoints (no auth required)
router.get('/public/stats', async (req, res) => {
  const { townId, period = '30d' } = req.query;
  
  const stats = await Complaint.aggregate([
    { 
      $match: { 
        townId: new ObjectId(townId),
        createdAt: { $gte: getStartDate(period) }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $in: ['$status.current', ['closed', 'verified']] }, 1, 0] }
        },
        avgResolutionHours: { $avg: '$metrics.resolutionHours' }
      }
    },
    {
      $project: {
        total: 1,
        resolved: 1,
        resolutionRate: { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
        avgResolutionHours: { $round: ['$avgResolutionHours', 1] }
      }
    }
  ]);
  
  // NO PII exposed
  res.json({
    period,
    stats: stats[0] || { total: 0, resolved: 0, resolutionRate: 0 }
  });
});
```

## 9.4 Auditability & Trust

### Audit Log Requirements

1. **Every status change** logged with actor, timestamp, metadata
2. **Every assignment** logged with assigner, assignee, reason
3. **Every escalation** logged with trigger, resolver, outcome
4. **Every user action** logged with IP, user agent, context

### Immutability

```javascript
// Status history is append-only
ComplaintSchema.methods.addStatusHistory = function(status, userId, role, remarks) {
  // History cannot be modified, only appended
  this.status.history.push({
    status,
    timestamp: new Date(),
    changedBy: userId,
    changedByRole: role,
    remarks
  });
  this.status.current = status;
};

// No direct modification of history allowed
ComplaintSchema.pre('save', function(next) {
  if (this.isModified('status.history')) {
    const original = this.status.history.length;
    const modified = this.get('status.history').length;
    if (modified < original) {
      throw new Error('Cannot delete status history');
    }
  }
  next();
});
```

### Data Retention

```javascript
// Audit logs: 2 years
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

// Complaints: Never deleted, archived after 1 year
ComplaintSchema.add({
  isArchived: { type: Boolean, default: false },
  archivedAt: Date
});

// Archive cron job
cron.schedule('0 2 * * *', async () => {
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 3600000);
  
  await Complaint.updateMany(
    {
      'status.current': 'closed',
      updatedAt: { $lt: oneYearAgo },
      isArchived: false
    },
    {
      $set: { isArchived: true, archivedAt: new Date() }
    }
  );
});
```

---

# 10. Implementation Phase Plan

## Phase 1: Core MVP (Weeks 1-6)

### Goal
Functional complaint submission and tracking for a single UC.

### Deliverables

**Backend**
- [ ] User model with OTP auth
- [ ] Complaint model (simplified)
- [ ] Category model with defaults
- [ ] Basic complaint CRUD
- [ ] Local classification (no AI yet)
- [ ] Basic status transitions

**Citizen App**
- [ ] Login (phone + OTP)
- [ ] New complaint form (text + location + images)
- [ ] My complaints list
- [ ] Complaint detail view

**UC Dashboard (Basic)**
- [ ] Login
- [ ] Complaint list view
- [ ] Assign to officer (manual)
- [ ] Mark as resolved

**Infrastructure**
- [ ] MongoDB Atlas setup
- [ ] Basic deployment (single server)
- [ ] SMS gateway integration (Twilio/local)

### Success Criteria
- Citizens can submit and track complaints
- UC Chairman can assign and resolve
- End-to-end flow works

---

## Phase 2: UC/Town Governance (Weeks 7-12)

### Goal
Full hierarchical governance with Town oversight.

### Deliverables

**Backend**
- [ ] Town model
- [ ] UC model with boundaries
- [ ] Department model
- [ ] Assignment model
- [ ] Resolution model
- [ ] Geo-based UC routing
- [ ] Role-based access control
- [ ] Verification workflow
- [ ] Citizen feedback

**Citizen App**
- [ ] Feedback after resolution
- [ ] Reopen complaint

**UC Dashboard (Enhanced)**
- [ ] Officer management
- [ ] Verification workflow
- [ ] Basic UC stats
- [ ] Escalation to Town

**Town Dashboard**
- [ ] UC overview
- [ ] Escalation management
- [ ] UC Chairman management
- [ ] Town-wide stats

**Infrastructure**
- [ ] Push notifications
- [ ] Email notifications
- [ ] Boundary data import

### Success Criteria
- Multi-UC town operational
- Escalation flow working
- Chairman verification working

---

## Phase 3: AI + Analytics (Weeks 13-18)

### Goal
Intelligent automation and data-driven insights.

### Deliverables

**Backend**
- [ ] GROQ integration for classification
- [ ] Severity scoring
- [ ] Duplicate detection
- [ ] SLA tracking
- [ ] Auto-escalation
- [ ] Stats aggregation jobs
- [ ] Analytics endpoints

**Citizen App**
- [ ] Voice complaint (speech-to-text)

**UC Dashboard**
- [ ] Analytics page
- [ ] Officer performance
- [ ] Category trends
- [ ] Heatmap

**Town Dashboard**
- [ ] UC comparison analytics
- [ ] Town-wide heatmap
- [ ] Report generation

**WhatsApp Bot**
- [ ] Complaint submission via WhatsApp
- [ ] Status check via WhatsApp

### Success Criteria
- 80%+ classification accuracy
- Duplicates flagged automatically
- SLA breaches auto-escalated
- WhatsApp complaints working

---

## Phase 4: NGO & Public Dashboards (Weeks 19-24)

### Goal
Transparency and external access.

### Deliverables

**Backend**
- [ ] Public analytics API
- [ ] NGO access tokens
- [ ] Export functionality (CSV, PDF)
- [ ] Audit log viewer

**Public Dashboard**
- [ ] Town-wide stats (anonymized)
- [ ] Category trends
- [ ] Resolution rates
- [ ] Public heatmap

**Admin Panel**
- [ ] User management
- [ ] Town/UC management
- [ ] Department/Category config
- [ ] System settings
- [ ] Audit log viewer

**Mobile Apps**
- [ ] Officer mobile app
- [ ] Push notification optimization
- [ ] Offline support

### Success Criteria
- Public can view anonymized stats
- NGOs can access data via API
- Admin can fully configure system

---

## Team Structure

### Recommended Team

| Role | Count | Responsibility |
|------|-------|----------------|
| Backend Developer | 2 | API, services, jobs |
| Frontend Developer (Web) | 2 | Dashboards |
| Mobile Developer | 1-2 | Citizen + Officer apps |
| DevOps | 1 | Infrastructure, CI/CD |
| QA | 1 | Testing |
| Product Manager | 1 | Requirements, UAT |
| UX Designer | 1 | Design system |

### Week-by-Week Milestones

| Week | Milestone |
|------|-----------|
| 1-2 | Setup, models, auth |
| 3-4 | Complaint CRUD, basic citizen app |
| 5-6 | UC dashboard basic, first deployment |
| 7-8 | Town model, UC routing |
| 9-10 | Verification, feedback |
| 11-12 | Town dashboard, escalations |
| 13-14 | AI classification |
| 15-16 | SLA, auto-escalation |
| 17-18 | WhatsApp bot, analytics |
| 19-20 | Public dashboard |
| 21-22 | Admin panel |
| 23-24 | Polish, testing, launch |

---

# Appendix

## A. Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=5

# Redis
REDIS_URL=redis://...

# External Services
GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GOOGLE_MAPS_API_KEY=...

# SMS
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Push Notifications
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# WhatsApp
WHATSAPP_SESSION_PATH=./sessions
```

## B. Status Flow Diagram

```
                    ┌─────────┐
                    │REPORTED │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          │          ▼
        ┌─────────┐      │    ┌─────────┐
        │REJECTED │      │    │ESCALATED│◄────────────┐
        └─────────┘      │    └────┬────┘             │
                         │         │                   │
                         ▼         ▼                   │
                    ┌─────────────────┐                │
                    │    ASSIGNED     │                │
                    └────────┬────────┘                │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │  IN_PROGRESS    │────────────────┤
                    └────────┬────────┘   (SLA breach) │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │    RESOLVED     │                │
                    └────────┬────────┘                │
                             │                         │
                             ▼                         │
                    ┌─────────────────┐                │
                    │PENDING_VERIFY   │                │
                    └────────┬────────┘                │
                             │                         │
              ┌──────────────┼──────────────┐          │
              │              │              │          │
              ▼              ▼              ▼          │
        ┌─────────┐    ┌─────────┐    ┌─────────┐     │
        │REOPENED │    │VERIFIED │    │(rejected)│────┘
        └────┬────┘    └────┬────┘    └─────────┘
             │              │
             │              ▼
             │         ┌─────────┐
             └────────▶│ CLOSED  │
                       └─────────┘
```

## C. API Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Phone number is required",
    "details": [
      {
        "field": "phone",
        "message": "Phone number is required"
      }
    ]
  }
}
```

---

**END OF IMPLEMENTATION GUIDE**

This document is the source of truth. Follow it exactly.
