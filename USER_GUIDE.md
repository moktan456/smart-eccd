# SMART ECCD – User Guide

This guide walks through how each role uses the system, in the order that makes sense for day-to-day operations.

---

## Table of Contents

1. [Center Manager](#1-center-manager)
   - [Initial Setup Checklist](#initial-setup-checklist)
   - [Staff Management](#staff-management)
   - [Parent Management](#parent-management)
   - [Enrolment & Class Assignment](#enrolment--class-assignment)
   - [Fee Management](#fee-management)
   - [Academic Calendar](#academic-calendar)
   - [Leave Review](#leave-review)
   - [Notifications & Announcements](#notifications--announcements)
   - [Reports](#reports)
2. [Teacher](#2-teacher)
   - [Designing Activities](#designing-activities)
   - [Assigning Activities](#assigning-activities)
   - [Conducting Activities](#conducting-activities)
   - [Taking Attendance](#taking-attendance)
3. [Parent](#3-parent)
   - [Registering an Account](#registering-an-account)
   - [Viewing Your Child's Progress](#viewing-your-childs-progress)
   - [Submitting a Leave Request](#submitting-a-leave-request)
   - [Messaging the Teacher](#messaging-the-teacher)

---

## 1. Center Manager

### Initial Setup Checklist

Before day-to-day use, complete these steps in order — each depends on the previous one.

| Step | Where | What to do |
|------|--------|-----------|
| 1 | **Classrooms** | Add the physical rooms in your center (name, floor, capacity) |
| 2 | **Staff** | Add teacher accounts (name, email, password) |
| 3 | **Classes** | Create classes — assign an age group, a teacher, and optionally a classroom |
| 4 | **Children** | Enrol children — assign each child to a class |
| 5 | **Parents** | Add parent accounts, then link each parent to their child(ren) |
| 6 | **Fees** | Create fee structures, then assign them to children |

---

### Staff Management

**Navigation:** Sidebar → **Staff**

1. Click **+ Add Teacher**.
2. Fill in Full Name, Email, and a temporary Password.
3. Click **Add**. The teacher can now log in and change their password from their Profile.
4. To edit or remove a teacher, use the **Edit** / **Remove** buttons on their row.

> Teachers see only the class they are assigned to. Assigning a teacher to a class is done in **Classes**, not here.

---

### Parent Management

**Navigation:** Sidebar → **Parents**

#### Adding a parent account manually

1. Click **+ Add Parent**.
2. Fill in Full Name, Email, Phone (optional), and Password.
3. Click **Add**.

#### Linking a parent to a child (from the Parents page)

1. Find the parent in the list and click **Link Children**.
2. Check the children that belong to this parent.
3. Click **Save**.

#### Linking a parent to a child (from the Children page)

1. Go to **Children**, find the child, and click **Link Parents** on their row.
2. Check the parent accounts to associate with this child.
3. Click **Save**.

> Parents can also self-register — see [Registering an Account](#registering-an-account). Once they register, link them here.

---

### Enrolment & Class Assignment

#### Creating a classroom

**Navigation:** Sidebar → **Classrooms**

1. Click **+ Add Classroom**.
2. Enter a room name (e.g. "Room A"), floor, and capacity.
3. Click **Save**.

#### Creating a class

**Navigation:** Sidebar → **Classes**

1. Click **+ New Class**.
2. Enter a Class Name (e.g. "Nursery A"), Age Group, assign a Teacher, and optionally a Classroom.
3. Click **Create Class**.

#### Enrolling a child

**Navigation:** Sidebar → **Children**

1. Click **+ Enrol Child**.
2. Fill in First Name, Last Name, Date of Birth, and select the Class.
3. Add Medical Notes if needed (stored encrypted).
4. Click **Enrol Child**.
5. A unique **Student ID** (e.g. `STU-2026-0001`) is shown — share this with the parent so they can self-register their account.

---

### Fee Management

**Navigation:** Sidebar → **Fees**

#### Step 1 — Create a fee type

1. Click **+ New Fee Type**.
2. Enter a name (e.g. "Monthly Tuition"), amount, and frequency (Monthly / Quarterly / Annual / One-time).
3. Set the due day of month (e.g. 5 = 5th of each month).
4. Click **Save**.

#### Step 2 — Assign the fee to children

1. On a fee type row, click **Assign to Children**.
2. Select the children and a due date.
3. Click **Assign** — fee records are created for each selected child.

#### Step 3 — Record a payment

1. In the **Fee Records** table, find the child's pending fee.
2. Click **Record Payment**.
3. Enter the amount paid and click **Save**.

#### Sending overdue reminders

Click **Send Overdue Reminders** at the top of the page — this triggers a notification to all parents with overdue fees.

---

### Academic Calendar

**Navigation:** Sidebar → **Calendar**

1. Click on any date or click **+ Add Event**.
2. Enter a Title, Event Type (Holiday, Exam, Function, Meeting, Activity, Other), start and end dates, and an optional description.
3. Toggle **Public** to make it visible to teachers and parents.
4. Click **Save**.

To edit or delete an event, click on it in the calendar view.

---

### Leave Review

**Navigation:** Sidebar → **Leave**

All leave requests submitted by parents appear here.

1. Click on a request to see the child's name, dates, and reason.
2. Click **Approve** or **Reject**.
3. Optionally add a review note.
4. The parent is notified automatically.

---

### Notifications & Announcements

**Navigation:** Sidebar → **Notifications**

1. Click **+ Broadcast Announcement**.
2. Write a title and message.
3. Select the audience (All Staff, All Parents, or specific roles).
4. Click **Send** — a notification is pushed to all selected users in real time.

---

### Reports

**Navigation:** Sidebar → **Reports**

Select a class to view:

- **Bloom's Taxonomy coverage** — which cognitive levels are being addressed in activities.
- **Attendance summary** — present / absent / late breakdown.
- **Flagged children** — children whose Bloom's scores fall significantly below class average, with suggested intervention levels.

---

## 2. Teacher

### Designing Activities

**Navigation:** Sidebar → **Activities** → **+ New Activity**

1. Fill in the Title, Description, and detailed Instructions.
2. Select an Activity Type (e.g. Art, Story, Movement) and Age Group.
3. Set Duration in minutes.
4. Under **Bloom's Taxonomy Levels**, check all cognitive levels this activity addresses (Remember, Understand, Apply, Analyse, Evaluate, Create).
5. Add Learning Goals (click **+ Add Goal** for each one).
6. Click **Create Activity**. The activity is saved as a Draft.

> To publish an activity so it can be assigned, open it and change its status to **Published**.

---

### Assigning Activities

**Navigation:** Sidebar → **Activities**

1. Find a published activity and click **Assign**.
2. Select the Class, date, and time.
3. Toggle **Recurring** if the activity repeats on a schedule.
4. Click **Assign** — the activity appears in the calendar and on the dashboard.

---

### Conducting Activities

**Navigation:** Sidebar → **Activities** → find an assigned activity → **Conduct**

Conducting an activity is a 3-step process:

**Step 1 — Mark Attendance**
- For each child in the class, select Present, Absent, Late, or Excused.
- Click **Next: Performance →**.

**Step 2 — Record Performance**
For each child who was present:
- Set **Completion Status** (Completed / Partial / Not Attempted).
- Select the **Bloom Level Achieved**.
- Rate each skill (1–5 stars).
- Add optional Observation Notes.
- Click **Next: Review →**.

**Step 3 — Review & Submit**
- Check the summary of attendance and performance records.
- Click **Submit Activity Record** to save. This cannot be undone.

---

### Taking Attendance

**Navigation:** Sidebar → **Attendance**

For days when no activity is being conducted:

1. Select the date from the date picker.
2. For each child, mark their status (Present / Absent / Late / Excused).
3. Add an optional note per child.
4. Click **Save Attendance**.

---

## 3. Parent

### Registering an Account

1. Go to the login page and click **Register with your child's Student ID →**.
2. Enter the **Student ID** given to you by the Center Manager (format: `STU-YYYY-NNNN`).
3. Fill in your name, email address, and a password.
4. Click **Register** — your account is created and linked to your child automatically.
5. Log in with your email and password.

> If you have multiple children enrolled, ask the manager to link the additional children to your account from the Parents page.

---

### Viewing Your Child's Progress

**Navigation:** Sidebar → **Reports** (or Dashboard cards)

- **Performance** — view your child's Bloom's Taxonomy scores across all conducted activities, including a radar chart showing cognitive development levels.
- **Attendance** — see a monthly attendance calendar with present, absent, late, and excused days.
- Click **Download Report** to save a printable PDF progress report.

---

### Submitting a Leave Request

**Navigation:** Sidebar → **Leave** → **+ New Request**

1. Select your child from the dropdown.
2. Set the **Start Date** and **End Date** of the absence.
3. Write the **Reason for Leave**.
4. Click **Submit Request**.

Your request appears in the list with a **Pending** status. The Center Manager will review it and you will receive a notification when it is approved or rejected.

---

### Messaging the Teacher

**Navigation:** Sidebar → **Messages** → **+ New Message**

1. Select the recipient from the **To** dropdown (your child's class teacher is listed automatically).
2. Add an optional Subject.
3. Write your message.
4. Click **Send**.

Replies from the teacher appear in the same Messages page.

---

*SMART ECCD v1.0 — Child Care Center Management Platform*
