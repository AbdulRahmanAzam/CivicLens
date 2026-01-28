/**
 * CivicLens Chatbot Knowledge Base
 * Contains all information the AI assistant needs to help users
 */

export const KNOWLEDGE_BASE = {
  // System prompt for the AI
  systemPrompt: `You are a helpful assistant for CivicLens, a civic complaint management platform. Your role is to:
- Help users navigate the website and understand features
- Guide them through submitting and tracking complaints
- Explain the blockchain transparency feature
- Answer frequently asked questions

Be concise, friendly, and helpful. Only answer questions related to CivicLens and civic complaints.
If asked about unrelated topics, politely redirect the conversation to CivicLens features.
Format responses clearly using simple language. Use bullet points for lists.`,

  // Website navigation and features
  websiteFlow: {
    registration: {
      title: "How to Register/Login",
      content: `To get started with CivicLens:

**Registration:**
1. Click the "Get Started" or "Sign Up" button on the homepage
2. Enter your full name, email address, and phone number
3. Create a secure password (at least 8 characters)
4. Select your role (Citizen, Township Official, or Mayor)
5. Verify your email address
6. Complete your profile setup

**Login:**
1. Click "Login" on the homepage
2. Enter your registered email and password
3. Click "Sign In" to access your dashboard

**Forgot Password:**
1. Click "Forgot Password" on the login page
2. Enter your registered email
3. Check your email for reset instructions
4. Create a new password`
    },
    
    submitComplaint: {
      title: "How to Submit a New Complaint",
      content: `To submit a complaint in CivicLens:

1. **Login** to your citizen account
2. Go to your **Dashboard**
3. Click **"Report Issue"** or **"New Complaint"** button
4. Fill in the complaint form:
   - Select a **Category** (Infrastructure, Utilities, Sanitation, etc.)
   - Describe the **Issue** in detail
   - Add **Location** (map marker or address)
   - Upload **Photos** as evidence (optional but recommended)
   - Set **Urgency Level** (Low, Medium, High)
5. Review your information
6. Click **"Submit Complaint"**

Your complaint will be recorded on the blockchain for transparency!`
    },
    
    trackComplaint: {
      title: "How to Track Complaint Status",
      content: `To track your complaint status:

1. **Login** to your account
2. Go to **Dashboard** → **My Complaints**
3. View the list of all your submitted complaints
4. Click on any complaint to see details including:
   - Current status
   - Timeline of updates
   - Assigned officials
   - Comments and responses

**Status Meanings:**
- 🟡 **Pending** - Complaint received, awaiting review
- 🔵 **Under Review** - Being evaluated by officials
- 🟣 **In Progress** - Work has begun on resolution
- 🟢 **Resolved** - Issue has been fixed
- 🔴 **Rejected** - Cannot be processed (see reason)
- ⚫ **Closed** - Final status after resolution`
    },
    
    viewHistory: {
      title: "How to View Complaint History",
      content: `To view your complete complaint history:

1. **Login** to your account
2. Navigate to **Dashboard**
3. Click **"My Complaints"** or **"History"** tab
4. You'll see all complaints with:
   - Date submitted
   - Category
   - Status
   - Last update

**Filtering Options:**
- Filter by status (Pending, Resolved, etc.)
- Filter by category
- Search by complaint ID or keywords
- Sort by date (newest/oldest)

**Blockchain Verification:**
- Click "View on Blockchain" to see the immutable record
- Verify the transaction on Sepolia Etherscan`
    },
    
    dashboard: {
      title: "How to Use the Dashboard",
      content: `Your CivicLens dashboard provides:

**For Citizens:**
- Quick statistics of your complaints
- Submit new complaints
- Track existing complaints
- View notifications
- Access map view of all issues

**For Township Officials:**
- View complaints in your area
- Update complaint status
- Assign resources
- Generate reports
- Communicate with citizens

**For Mayors:**
- City-wide overview
- Analytics and trends
- Department performance
- Resource allocation
- Strategic planning tools`
    }
  },

  // Feature explanations
  features: {
    notifications: {
      title: "How Notifications Work",
      content: `CivicLens keeps you informed with notifications:

**Types of Notifications:**
- ✅ Status updates on your complaints
- 💬 New comments or responses
- 📋 Assignment notifications (for officials)
- 🔔 System announcements

**Notification Channels:**
- In-app notifications (bell icon)
- Email notifications
- WhatsApp updates (if enabled)

**Managing Notifications:**
1. Go to Settings → Notifications
2. Choose which notifications to receive
3. Set your preferred channels
4. Customize email frequency`
    },
    
    search: {
      title: "How to Filter and Search",
      content: `Find complaints quickly using search and filters:

**Search:**
- Use the search bar to find by keyword
- Search by complaint ID
- Search by location or address

**Filters:**
- **Status:** Pending, In Progress, Resolved, etc.
- **Category:** Infrastructure, Utilities, Sanitation
- **Date Range:** Select start and end dates
- **Severity:** Low, Medium, High, Critical
- **Location:** Town, UC, or specific area

**Map Filters:**
- Toggle heatmap view
- Show/hide markers
- View town boundaries
- Filter by multiple categories`
    },
    
    categories: {
      title: "Complaint Categories Explained",
      content: `CivicLens supports various complaint categories:

**🏗️ Infrastructure**
- Road damage, potholes
- Bridge repairs
- Public building issues
- Sidewalk problems

**💡 Utilities**
- Electricity issues
- Gas supply problems
- Water supply interruptions

**🗑️ Sanitation**
- Garbage collection
- Street cleaning
- Sewage problems
- Public toilet maintenance

**🌳 Environment**
- Park maintenance
- Tree trimming
- Pollution concerns
- Illegal dumping

**🚦 Traffic**
- Signal malfunctions
- Parking issues
- Road signs
- Traffic congestion

**🏥 Health**
- Hospital services
- Public health concerns
- Disease outbreaks`
    },
    
    roles: {
      title: "Role-Based Access",
      content: `CivicLens has three user roles:

**👤 Citizen**
- Submit complaints
- Track personal complaints
- View public map
- Receive updates

**🏛️ Township Official**
- View area complaints
- Update complaint status
- Communicate with citizens
- Generate local reports
- Manage resources

**🎖️ Mayor**
- City-wide dashboard
- All department overview
- Analytics and trends
- Strategic planning
- Performance monitoring

Each role has access to features appropriate to their responsibilities.`
    }
  },

  // Complaint process
  complaintProcess: {
    submission: {
      title: "Step-by-Step Complaint Submission",
      content: `**Complete Guide to Submitting a Complaint:**

**Step 1: Access the Form**
- Login to your account
- Click "Report Issue" button

**Step 2: Select Category**
- Choose the most appropriate category
- This helps route to the right department

**Step 3: Describe the Issue**
- Write a clear, detailed description
- Include what, where, when, and impact
- Be specific but concise

**Step 4: Add Location**
- Use the map to pin exact location
- Or enter address manually
- Location helps officials find the issue

**Step 5: Upload Evidence**
- Add photos (up to 5 images, max 5MB each)
- Photos help verify the complaint
- Include different angles if possible

**Step 6: Set Urgency**
- Low: Minor inconvenience
- Medium: Needs attention soon
- High: Safety concern or major impact

**Step 7: Review & Submit**
- Check all information is correct
- Click Submit
- Save your complaint ID for tracking`
    },
    
    requirements: {
      title: "Required Information",
      content: `**Mandatory fields for complaints:**
- Category selection
- Issue description (minimum 20 characters)
- Location (map pin or address)

**Recommended additions:**
- Photos/evidence
- Contact phone number
- Preferred contact time
- Urgency level

**Information NOT required:**
- Personal ID documents
- Financial information
- Detailed personal history`
    },
    
    timeline: {
      title: "Expected Response Times",
      content: `**Typical complaint timelines:**

**Initial Response:**
- Within 24-48 hours of submission
- Acknowledgment and assignment

**Status Updates:**
- Regular updates as work progresses
- Notifications at each stage

**Resolution Time (varies by type):**
- **Minor issues:** 3-7 days
- **Moderate issues:** 1-2 weeks
- **Major infrastructure:** 2-4 weeks
- **Complex projects:** May take longer

**Factors affecting timeline:**
- Issue complexity
- Resource availability
- Weather conditions
- Budget constraints

*Note: All updates are recorded on blockchain for transparency*`
    },
    
    statusGuide: {
      title: "Understanding Status Meanings",
      content: `**Complaint Status Guide:**

🟡 **Pending**
- Your complaint has been received
- Waiting for initial review
- No action taken yet

🔵 **Under Review**
- Being evaluated by officials
- Assessing resources needed
- May request more information

🟣 **In Progress**
- Work has begun
- Resources assigned
- Active resolution efforts

🟢 **Resolved**
- Issue has been fixed
- Solution implemented
- Please verify and provide feedback

🔴 **Rejected**
- Cannot be processed
- Check reason provided
- May need resubmission with corrections

⚫ **Closed**
- Final status
- Either resolved or rejected
- No further action needed`
    },
    
    additionalInfo: {
      title: "Adding Information to Existing Complaint",
      content: `**To add more information to an existing complaint:**

1. Go to Dashboard → My Complaints
2. Click on the complaint you want to update
3. Scroll to the "Comments" section
4. Click "Add Comment" or "Upload Photo"
5. Enter your additional information
6. Submit

**When to add information:**
- New developments related to the issue
- Additional photos showing changes
- Response to official questions
- Correction of initial details

**Note:** Original complaint details cannot be edited after submission (for blockchain integrity), but you can add comments and supplementary information.`
    }
  },

  // Blockchain transparency
  blockchain: {
    why: {
      title: "Why Blockchain is Used",
      content: `**CivicLens uses blockchain for transparency:**

**🔒 Immutability**
- Once recorded, data cannot be altered
- No one can delete or modify records
- Creates permanent audit trail

**👁️ Transparency**
- Anyone can verify records
- Public ledger visible to all
- Builds trust in the system

**🔍 Accountability**
- All status changes are recorded
- Officials' actions are trackable
- Citizens can verify claims

**⏰ Timestamping**
- Exact time of each action recorded
- Cannot be backdated
- Creates accurate timeline

**Why Sepolia Testnet?**
- Safe testing environment
- No real money required
- Same security as mainnet
- Perfect for demonstration`
    },
    
    whatRecorded: {
      title: "What Gets Recorded on Blockchain",
      content: `**Information recorded on-chain:**

**For each complaint:**
- Unique complaint ID
- Timestamp of creation
- Category
- Hashed details (for privacy)
- Initial status

**For each status update:**
- Previous status
- New status
- Timestamp of change
- Transaction hash

**What's NOT on blockchain:**
- Personal details (protected)
- Full complaint text
- Photos
- Comments

**Privacy balance:**
- Sensitive data stays in database
- Only verification hashes on-chain
- Best of both worlds`
    },
    
    verify: {
      title: "How to Verify on Sepolia Etherscan",
      content: `**To verify your complaint on the blockchain:**

1. **Find your transaction hash**
   - Go to complaint details
   - Click "View on Blockchain"
   - Copy the transaction hash

2. **Visit Sepolia Etherscan**
   - Go to sepolia.etherscan.io
   - Paste your transaction hash
   - Press Enter

3. **What you'll see:**
   - Transaction status (Success/Failed)
   - Block number
   - Timestamp
   - From/To addresses
   - Transaction data

4. **Verify the data:**
   - Check timestamp matches
   - Confirm it's our contract address
   - View the decoded input data

**Our Contract:** View all complaints at the contract address on Sepolia Etherscan.`
    },
    
    transactionHash: {
      title: "What is a Transaction Hash",
      content: `**Transaction Hash Explained:**

A transaction hash (txHash) is a unique 66-character identifier:
\`0x1234...abcd\`

**It represents:**
- A specific transaction on the blockchain
- Unique fingerprint of that action
- Permanent reference number

**How it's created:**
- Algorithm processes transaction data
- Creates unique hash
- Like a digital receipt number

**What you can do with it:**
- Look up transaction on Etherscan
- Verify when it occurred
- Confirm it was successful
- Share as proof of record

**Example uses:**
- "My complaint was recorded at this hash"
- "Status was updated - here's the proof"
- Verification for disputes`
    },
    
    immutability: {
      title: "Transparency and Immutability",
      content: `**How Blockchain Ensures Transparency:**

**Immutability:**
- Data cannot be changed once written
- No backdating possible
- No deletion capability
- Historical record preserved forever

**Verification:**
- Anyone can check the records
- No special access needed
- Use Sepolia Etherscan to verify
- Mathematical proof of integrity

**Benefits for Citizens:**
- Can't be told "we never received it"
- Status history is provable
- Timeline is accurate
- Officials accountable

**Benefits for Officials:**
- Clear audit trail
- Proof of timely action
- Protection against false claims
- Building public trust

**Trust Model:**
- "Don't trust, verify"
- Evidence over promises
- Transparency by design`
    }
  },

  // FAQs
  faqs: {
    dataSecure: {
      question: "Is my data secure?",
      answer: `**Yes, your data is secure:**

**Database Security:**
- Encrypted data storage
- Secure authentication
- Role-based access control
- Regular security audits

**Blockchain Privacy:**
- Personal details NOT on blockchain
- Only hashed identifiers stored
- Full details in secure database
- Privacy-preserving design

**Your Protection:**
- Strong password required
- Session management
- Secure HTTPS connection
- No data sold to third parties`
    },
    
    editComplaint: {
      question: "Can I edit my complaint after submission?",
      answer: `**Editing Complaints:**

**You CANNOT edit:**
- Original complaint description
- Category
- Location
- Initial submission details

**Why not?**
- Blockchain records are immutable
- Ensures integrity of records
- Prevents tampering

**You CAN add:**
- Comments with new information
- Additional photos
- Updates on the situation
- Response to official questions

**If major changes needed:**
- Add a detailed comment explaining
- Contact support if necessary
- In rare cases, may submit new complaint`
    },
    
    resolutionTime: {
      question: "How long does resolution take?",
      answer: `**Resolution Timeline:**

**Typical timeframes:**
- Minor issues: 3-7 days
- Moderate issues: 1-2 weeks
- Major issues: 2-4 weeks
- Complex projects: Variable

**Factors affecting time:**
- Type and severity of issue
- Available resources
- Weather conditions
- Budget constraints
- Number of complaints

**You'll receive:**
- Initial acknowledgment: 24-48 hours
- Regular status updates
- Notification on resolution

**If delayed:**
- Add a comment asking for update
- Check for any requests for info
- Contact township office if urgent`
    },
    
    whoCanSee: {
      question: "Who can see my complaint?",
      answer: `**Complaint Visibility:**

**Your complaint can be seen by:**
- You (full details)
- Assigned officials (full details)
- Township admins (full details)
- Mayor's office (full details)

**Public visibility:**
- Complaints appear on public map
- Location marker visible
- Category visible
- Status visible

**Private information:**
- Your name (not shown publicly)
- Contact details (private)
- Personal comments (private)

**Blockchain records:**
- Only hashed IDs (no personal info)
- Category and status (public)
- Timestamp (public)`
    },
    
    sepoliaTestnet: {
      question: "What is Sepolia testnet?",
      answer: `**Sepolia Testnet Explained:**

**What is it?**
- Test version of Ethereum
- Real blockchain technology
- No real money involved
- Same security as mainnet

**Why use it?**
- Safe for testing
- Free to use
- Demonstrates blockchain benefits
- No financial risk

**How it works:**
- Uses "test ETH" (no value)
- Transactions work like real Ethereum
- Verifiable on Sepolia Etherscan
- Perfect for demonstrations

**For judges/evaluators:**
- Can verify all transactions
- See real blockchain in action
- Understand transparency benefits
- No cryptocurrency knowledge needed`
    },
    
    needCrypto: {
      question: "Do I need cryptocurrency to use this?",
      answer: `**NO cryptocurrency needed!**

**As a user:**
- No crypto wallet required
- No ETH or tokens needed
- Just regular email/password login
- Completely free to use

**Blockchain happens behind the scenes:**
- System handles all transactions
- Uses Sepolia testnet (free)
- No cost to you
- Transparent but automatic

**What you need:**
- Valid email address
- Phone number
- Modern web browser
- That's it!

**Optional:**
- MetaMask (only if you want to verify transactions yourself)
- But NOT required for normal use`
    },
    
    contactSupport: {
      question: "How do I contact support?",
      answer: `**Contact Support:**

**Within the app:**
- Use the AI chatbot (that's me!)
- Click Help icon in dashboard
- Submit feedback form

**Direct contact:**
- Email: support@civiclens.com
- WhatsApp: Available in app
- Phone: Check contact page

**For urgent issues:**
- Mark complaint as High urgency
- Add "URGENT" in comments
- Follow up via phone

**Community:**
- FAQ section in Help
- User guides available
- Tutorial videos (coming soon)`
    }
  },

  // Quick actions for chatbot
  quickActions: [
    { label: "Submit a complaint", query: "How do I submit a new complaint?" },
    { label: "Track my complaint", query: "How can I track my complaint status?" },
    { label: "Blockchain explained", query: "What is blockchain and why is it used?" },
    { label: "Contact support", query: "How do I contact support?" },
  ]
};

/**
 * Get formatted context for the AI
 */
export const getFormattedContext = () => {
  let context = "CIVICLENS KNOWLEDGE BASE:\n\n";
  
  // Add all sections
  Object.entries(KNOWLEDGE_BASE).forEach(([section, content]) => {
    if (section === 'systemPrompt' || section === 'quickActions') return;
    
    context += `=== ${section.toUpperCase()} ===\n`;
    
    if (typeof content === 'object') {
      Object.entries(content).forEach(([key, item]) => {
        if (item.title) {
          context += `\n## ${item.title}\n`;
          context += item.content || item.answer || '';
          context += '\n';
        }
      });
    }
    context += '\n';
  });
  
  return context;
};

export default KNOWLEDGE_BASE;
