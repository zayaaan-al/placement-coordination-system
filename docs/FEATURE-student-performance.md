# Student Performance Feature

This document summarizes the Student Performance feature: backend API routes, response shapes, client components, and recommended verification steps.

---

## 1. Backend API

All routes are authenticated and role-gated for **students** via `authenticate` + `authorize(['student'])`.

Base prefix (from server routing):

```http
/ api / v1 / students
```

### 1.1 `GET /api/v1/students/me/performance`

Returns grouped performance data for the **currently authenticated student** only.

- **Guards**: `authenticate`, `authorize(['student'])`
- **Data source**: `StudentEvaluation` filtered by `studentUserId: req.user._id`

**Response shape (success):**

```json
{
  "success": true,
  "data": {
    "studentProfile": { /* StudentProfile with trainer populated */ },
    "evaluations": [ /* flat list of StudentEvaluation docs */ ],
    "groupedByType": {
      "aptitude": [ /* evaluations of this type */ ],
      "logical": [],
      "machine": [],
      "spring_meet": []
    },
    "latestByType": {
      "aptitude": { /* latest evaluation of this type */ },
      "logical": { },
      "machine": { },
      "spring_meet": { }
    },
    "weeklyEvaluations": [ /* frequency === 'weekly' */ ],
    "monthlyEvaluations": [ /* frequency === 'monthly' */ ],
    "groupedByYearMonth": {
      "2025": {
        "year": 2025,
        "months": {
          "2025-03": {
            "monthKey": "2025-03",
            "label": "March 2025",
            "weeklyEntries": [
              {
                "_id": "...",
                "type": "aptitude",
                "score": 20,
                "maxScore": 25,
                "percentage": 80,
                "periodLabel": "Week of Mar 1",
                "recordedDate": "2025-03-01T00:00:00.000Z",
                "updatedAt": "2025-03-01T12:00:00.000Z"
              }
            ],
            "springMeet": {
              "type": "spring_meet",
              "score": 70,
              "maxScore": 100,
              "percentage": 70,
              "periodLabel": "Sprint Meet",
              "recordedDate": "2025-03-20T00:00:00.000Z"
            },
            "stats": {
              "averagePercentage": 76.2,
              "perTypeAverages": {
                "aptitude": 80,
                "logical": 74,
                "machine": 75,
                "spring_meet": 70
              },
              "lastUpdated": "2025-03-21T10:12:34.567Z"
            }
          }
        }
      }
    }
  }
}
```

### 1.2 `GET /api/v1/students/me/performance/latest`

Returns **hero metrics** for the latest month that has evaluations for the student.

**Response shape (success):**

```json
{
  "success": true,
  "data": {
    "period": {
      "year": 2025,
      "monthIndex": 2,
      "label": "March 2025"
    },
    "averagePercentage": 76.2,
    "perTypeAverages": {
      "aptitude": 80,
      "logical": 74,
      "machine": 75,
      "spring_meet": 70
    },
    "springMeet": {
      "score": 70,
      "maxScore": 100,
      "percentage": 70,
      "periodLabel": "Sprint Meet",
      "recordedDate": "2025-03-20T00:00:00.000Z"
    },
    "status": "COMPLETED", // or "IN_PROGRESS" when no spring_meet yet
    "lastUpdated": "2025-03-21T10:12:34.567Z"
  }
}
```

If the student has no evaluations yet, `data` may be `null`.

### 1.3 `GET /api/v1/students/me/performance/alerts`

Lightweight polling endpoint used by the client to detect changes without reloading full data.

Query params:

- `since` (optional, ISO-8601 string): last seen `updatedAt` timestamp.

**Response shape:**

```json
{
  "success": true,
  "data": {
    "hasUpdates": true,
    "lastUpdated": "2025-03-21T10:12:34.567Z"
  }
}
```

- `hasUpdates` is `true` if any `StudentEvaluation.updatedAt > since` for the current student.
- `lastUpdated` is the newest `updatedAt` across this students evaluations or `null` if none.

---

## 2. Client Integration

### 2.1 API client (`client/src/services/api.js`)

Extended `studentsAPI`:

```ts
getMyPerformance: () => api.get('/students/me/performance'),
getMyPerformanceLatest: () => api.get('/students/me/performance/latest'),
getMyPerformanceAlerts: (params) => api.get('/students/me/performance/alerts', { params }),
```

These are consumed by the Student Performance page.

### 2.2 Routing & navigation

- **Sidebar** (`client/src/components/Layout/Sidebar.jsx`)
  - For `student` role, new item:

    ```js
    { name: 'Performance', href: '/students/performance', icon: ChartBarIcon }
    ```

- **Route** (`client/src/App.jsx`)

  ```jsx
  <Route path="students/performance" element={
    <ProtectedRoute allowedRoles={['student']}>
      <MyPerformance />
    </ProtectedRoute>
  } />
  ```

### 2.3 Page & components

#### `MyPerformance.jsx` (Student page)

- Fetches:
  - `studentsAPI.getMyPerformance()`
  - `studentsAPI.getMyPerformanceLatest()`
- Stores:
  - `performance` (grouped structure)
  - `hero` (hero metrics)
  - `selectedMonthKey`
  - `lastUpdated` (for polling)
- Polling loop (20s interval):
  - Calls `/students/me/performance/alerts?since=lastUpdated`.
  - On `hasUpdates: true`:
    - Shows toast `"Your trainer has updated your evaluations"`.
    - Refetches main + hero data.
  - Updates `lastUpdated` from the alert payload.
- Derives flattened `monthsFlat` and current month selection:
  - `currentMonth`, `availableMonths`, `weeklyEntriesForSelected`.
- Computes `trendForHero` comparing latest vs previous month averages.
- Layout:
  - Header: `My Performance`.
  - `PerformanceHero hero={hero} trend={trendForHero}`.
  - Left: `MonthDetails` + `WeeklyTable`.
  - Right: `WeekTrendChart` (mobile + desktop), `PerformanceChart`, `InsightsPanel`.

#### `PerformanceHero.jsx`

- Shows:
  - Current month label.
  - Status badge (COMPLETED vs IN_PROGRESS).
  - Average % and last updated.
  - Per-test averages.
  - Trend pill derived from `trend` prop, e.g.:

    > Performance up 4.2% vs February 2025

- Icons from `lucide-react`.

#### `MonthDetails.jsx`

- Displays current month label and `<select>` for `availableMonths`.
- Shows Sprint Meet details if `month.springMeet` exists.

#### `WeeklyTable.jsx`

- Tabular weekly breakdown for the selected month:
  - Week label, Aptitude (0–25), Logical, Machine, recorded date.
- Uses normalized evaluation entries from backend.

#### `PerformanceChart.jsx`

- Combined line + stacked bar chart using Recharts:
  - X-axis: month labels.
  - Stacked bars: Aptitude, Logical, Machine, Sprint Meet (all in %).
  - Line: monthly average percentage.
- Custom, keyboard-focusable legend:
  - `<button>`s with `aria-pressed`, focus ring, Enter/Space handlers.
  - Allows toggling series visibility.
- Accessible container:

  ```jsx
  <section aria-label="Monthly performance trend and breakdown"> ... </section>
  ```

#### `WeekTrendChart.jsx`

- Week-level line chart (Recharts) that averages percentages across tests per week.
- Rendered:
  - Above monthly chart on small screens (`block md:hidden`).
  - Below monthly chart on desktop (`hidden md:block`).
- Accessible container:

  ```jsx
  <section aria-label="Weekly performance trend for selected month"> ... </section>
  ```

#### `InsightsPanel.jsx`

- Uses `hero` + `performance.groupedByYearMonth` to generate dynamic tips:
  - Weakest area this month (lowest per-type average) + suggestion.
  - Strongest area this month and encouragement.
  - Change in overall average vs previous month (if >= 0.5%).
  - Fallback generic tip if data is limited.
- Accessible container with list of insights.

---

## 3. Tests

Server-side:

- `server/tests/studentPerformance.test.js`
  - Verifies:
    - Non-students are forbidden from `/students/me/performance`.
    - Only evaluations for the authenticated student are returned.
    - `/students/me/performance/latest` returns hero metrics when data exists.
    - `/students/me/performance/alerts` detects updates after a `since` timestamp.

Client-side (Jest + React Testing Library):

- `client/src/components/Evaluation/__tests__/PerformanceChart.test.jsx`
  - Smoke test for rendering Performance overview with sample month data.
- `WeekTrendChart.test.jsx`
  - Renders the weekly trend when given sample entries.
- `PerformanceHero.test.jsx`
  - Asserts that trend text like `"Performance up 4.2% vs February 2025"` renders.
- `AnalyticsColumn.test.jsx`
  - Asserts that both monthly and weekly charts render in a combined layout with sample data.
- `InsightsPanel.test.jsx`
  - Confirms a dynamic "weakest area" tip appears with realistic `hero` + `performance` input.

> **TODO**: Align test runner configuration (Jest/Vitest) and ensure all Evaluation tests are wired into the main client test command.

---

## 4. Manual Verification Checklist

1. **Student access and layout**
   - Log in as a **student**.
   - Open `/students/performance` via the sidebar `Performance` link.
   - Confirm:
     - Hero shows current month, status, average %, per-type averages, and last updated.
     - Month selector lists months with evaluations.
     - Weekly table shows entries for the selected month.
     - Sprint Meet card appears when a `spring_meet` evaluation exists.

2. **Charts & insights**
   - With at least 2 months of data:
     - Monthly chart shows a line + stacked bars per month.
     - Week trend chart shows a line of weekly averages when weekly entries exist.
     - Legend buttons can be toggled via keyboard and mouse.
     - Insights panel contains tips about weakest/strongest areas and any change vs previous month.

3. **Real-time-like updates via polling**
   - On another session, log in as the students trainer.
   - Add or update evaluations for that student.
   - With the Student Performance page open:
     - Within ~20 seconds, a toast appears: `"Your trainer has updated your evaluations"`.
     - Hero, charts, and table reflect the new data after refresh.

4. **Access control**
   - As **trainer** or **coordinator**, attempt to open `/students/performance`.
   - Confirm that `ProtectedRoute` prevents access (same behavior as other student-only routes).
   - Confirm there is no way to request another students data via ID; all student endpoints bind to `req.user._id`.

---

## 5. Follow-ups / TODOs

- **TODO**: Integrate WebSocket-based real-time notifications and replace or augment the polling endpoint `/students/me/performance/alerts`.
- **TODO**: Add richer visualizations (e.g., per-week bar charts per test type) once more evaluation data is available.
- **TODO**: Extend InsightsPanel with more granular, ML-driven suggestions as data grows.
