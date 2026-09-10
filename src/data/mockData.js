export const currentUserMock = {
  id: "usr_priyan_992",
  name: "Priyan Sharma",
  email: "priyan.sharma@example.com",
  role: "individual", // 'individual' or 'recruiter'
  headline: "Senior Software Engineer | Full-Stack & AI Systems",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  trustScore: 92,
  profileCompletion: 88,
  verifiedCount: 4,
  flaggedCount: 1,
  unsupportedCount: 1,
  verificationDate: "Sep 02, 2026",
  publicId: "priyan-sharma-928374",
  summary: "Results-driven Software Engineer with 4+ years of experience in distributed backend engines, modern cloud computing, and real-time frontend user interfaces."
};

export const categoryScoresMock = [
  { category: "Identity Consistency", score: 98, status: "Verified", description: "Government ID name, DOB, and SSN match resume details precisely." },
  { category: "Education Consistency", score: 100, status: "Verified", description: "Degree transcript matches B.Tech in Computer Science from IIT Delhi." },
  { category: "Work Experience", score: 85, status: "Mismatch Detected", description: "Experience letter confirms 2.5 yrs vs 3.0 yrs stated on resume for TechCorp." },
  { category: "Certifications", score: 90, status: "Verified", description: "AWS Certified Solutions Architect & Certified Scrum Master hash validated." }
];

export const uploadedDocumentsMock = [
  {
    id: "doc_1",
    name: "Priyan_Sharma_Resume_2026.pdf",
    category: "Resume",
    fileSize: "1.4 MB",
    uploadedAt: "2026-09-01 10:30 AM",
    status: "Verified",
    hash: "0x89f2a71c8901bc",
    extractedClaims: 6
  },
  {
    id: "doc_2",
    name: "BTech_Degree_IIT_Delhi.pdf",
    category: "Degree / Marksheet",
    fileSize: "3.2 MB",
    uploadedAt: "2026-09-01 10:32 AM",
    status: "Verified",
    hash: "0xa19c72e901f421",
    extractedClaims: 2
  },
  {
    id: "doc_3",
    name: "AWS_Solutions_Architect_Cert.pdf",
    category: "Certifications",
    fileSize: "850 KB",
    uploadedAt: "2026-09-01 10:35 AM",
    status: "Verified",
    hash: "0x3f7b8c9120de4a",
    extractedClaims: 1
  },
  {
    id: "doc_4",
    name: "TechCorp_Experience_Relieving_Letter.pdf",
    category: "Experience Letter",
    fileSize: "2.1 MB",
    uploadedAt: "2026-09-01 10:36 AM",
    status: "Mismatch",
    hash: "0xee718b29f0321a",
    extractedClaims: 2
  },
  {
    id: "doc_5",
    name: "Passport_Govt_ID_Proof.pdf",
    category: "Government ID",
    fileSize: "4.0 MB",
    uploadedAt: "2026-09-01 10:38 AM",
    status: "Verified",
    hash: "0x45ab901f37210c",
    extractedClaims: 1
  }
];

export const claimsAnalysisMock = [
  {
    id: "claim_1",
    category: "Education",
    claimText: "B.Tech in Computer Science & Engineering - IIT Delhi (2018 - 2022, CGPA: 8.9/10)",
    matchedDocument: "BTech_Degree_IIT_Delhi.pdf",
    status: "Match",
    confidence: "99%",
    details: "Degree certificate hash matched IIT Delhi registrar public directory ledger. Graduated May 2022 with CGPA 8.9."
  },
  {
    id: "claim_2",
    category: "Experience",
    claimText: "Senior Full Stack Engineer at TechCorp Inc. (Jan 2023 - Present | 3.5 Years)",
    matchedDocument: "TechCorp_Experience_Relieving_Letter.pdf",
    status: "Mismatch",
    confidence: "94%",
    details: "Discrepancy: Experience letter states start date as June 2023 (Actual tenure: 3.2 Years). Stated title on letter is 'Software Engineer II' instead of 'Senior Engineer'."
  },
  {
    id: "claim_3",
    category: "Certifications",
    claimText: "AWS Certified Solutions Architect – Associate (Validation ID: AWS-99210-SA)",
    matchedDocument: "AWS_Solutions_Architect_Cert.pdf",
    status: "Match",
    confidence: "98%",
    details: "AWS Certification API record verified active status through Nov 2027."
  },
  {
    id: "claim_4",
    category: "Experience",
    claimText: "Frontend Engineer Intern at MetaCraft Solutions (May 2021 - Aug 2021)",
    matchedDocument: "MetaCraft_Internship_Certificate.pdf",
    status: "Match",
    confidence: "96%",
    details: "Internship certificate verified with HR digital signature."
  },
  {
    id: "claim_5",
    category: "Skills & Publications",
    claimText: "Co-authored IEEE Research Paper: 'Zero-Knowledge Proofs in Credential Verification'",
    matchedDocument: "None Uploaded",
    status: "Unsupported",
    confidence: "0%",
    details: "No publication document or DOI reference link was uploaded to support this claim."
  }
];

export const recruitersCandidatesMock = [
  {
    id: "cand_1",
    name: "Priyan Sharma",
    email: "priyan.sharma@example.com",
    roleApplied: "Lead Full Stack Developer",
    trustScore: 92,
    verifiedCount: 4,
    flaggedCount: 1,
    unsupportedCount: 1,
    lastVerified: "2026-09-02",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
    status: "Highly Verified",
    topSkills: ["React", "Node.js", "AWS", "Python"],
    publicId: "priyan-sharma-928374"
  },
  {
    id: "cand_2",
    name: "Alex Rivera",
    email: "alex.rivera@techmail.com",
    roleApplied: "DevOps / Infrastructure Lead",
    trustScore: 98,
    verifiedCount: 6,
    flaggedCount: 0,
    unsupportedCount: 0,
    lastVerified: "2026-09-04",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
    status: "Fully Verified",
    topSkills: ["Kubernetes", "Terraform", "Docker", "AWS"],
    publicId: "alex-rivera-110293"
  },
  {
    id: "cand_3",
    name: "Sarah Chen",
    email: "sarah.chen@innovate.org",
    roleApplied: "Senior AI / ML Research Engineer",
    trustScore: 84,
    verifiedCount: 3,
    flaggedCount: 2,
    unsupportedCount: 1,
    lastVerified: "2026-08-29",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
    status: "Needs Review",
    topSkills: ["PyTorch", "LLMs", "Python", "C++"],
    publicId: "sarah-chen-773821"
  },
  {
    id: "cand_4",
    name: "Marcus Vance",
    email: "marcus.v@cloudnet.io",
    roleApplied: "Product Manager - Platform Security",
    trustScore: 95,
    verifiedCount: 5,
    flaggedCount: 0,
    unsupportedCount: 1,
    lastVerified: "2026-09-03",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250",
    status: "Highly Verified",
    topSkills: ["Product Strategy", "Agile", "SOC2", "Data Privacy"],
    publicId: "marcus-vance-449102"
  },
  {
    id: "cand_5",
    name: "Aarav Patel",
    email: "aarav.p@startup.in",
    roleApplied: "Junior Frontend Developer",
    trustScore: 78,
    verifiedCount: 2,
    flaggedCount: 1,
    unsupportedCount: 2,
    lastVerified: "2026-08-30",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250",
    status: "Needs Review",
    topSkills: ["JavaScript", "HTML/CSS", "React", "Git"],
    publicId: "aarav-patel-332910"
  }
];

export const verificationActivityMock = [
  { id: "act_1", date: "Sep 02, 2026", action: "Re-run Verification Analysis", status: "Completed", score: 92 },
  { id: "act_2", date: "Sep 01, 2026", action: "Uploaded Experience Letter", status: "Mismatch Alert", score: 88 },
  { id: "act_3", date: "Sep 01, 2026", action: "Uploaded AWS Certification", status: "Verified", score: 94 },
  { id: "act_4", date: "Aug 28, 2026", action: "Initial Resume Upload & Extraction", status: "Completed", score: 75 }
];
