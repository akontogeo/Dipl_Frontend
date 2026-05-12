import React from 'react';

const Analytics = () => {
  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Analysis & Reports</h1>
        <p className="subtitle">Choose the session you want to analyze !!</p>
      </div>

      <div className="reports-container">
        <h2 className="reports-title">📊 Session Reports</h2>
        <div className="reports-grid">
          
          {/* 1. Report Overview - Pie Chart */}
          <ReportCard 
            title="Report Overview" 
            subtitle="Overview of trends in pupil behavior (Gaze Share)"
          >
            <img src="/path/to/report_pie.png" alt="Report Overview" />
          </ReportCard>

          {/* 2. Fixation Timeline - Updated */}
          <ReportCard 
            title="Fixation Timeline" 
            subtitle="Timeline Chart – Fixation events over time"
          >
            <img src="/path/to/report_fixation_timeline.png" alt="Fixation Timeline" />
          </ReportCard>

          {/* 3. Time to First Fixation (Scientific) - Updated */}
          <ReportCard 
            title="Time to First Fixation (Scientific)" 
            subtitle="Bar Chart – TTFF per object (scientific notation)"
          >
            <img src="/path/to/report_ttff_scientific.png" alt="Time to First Fixation (Scientific)" />
          </ReportCard>

          {/* 4. Pupil Dynamics - Line Chart */}
          <ReportCard 
            title="Pupil Dynamics" 
            subtitle="Dynamics of pupil behavior (Average Diameter)"
          >
            <img src="/path/to/report_pupil.png" alt="Pupil Dynamics" />
          </ReportCard>

          {/* 5. Dwell Time Analysis - ΝΕΟ */}
          <ReportCard 
            title="Dwell Time Analysis" 
            subtitle="Bar Chart – Total time spent on each object"
          >
            <img src="/path/to/dwell_bar_chart.png" alt="Dwell Time" />
          </ReportCard>

          {/* 6. Pupil Fluctuations - ΝΕΟ */}
          <ReportCard 
            title="Pupil Fluctuations" 
            subtitle="Line Chart – Diameter fluctuations over time"
          >
            <img src="/path/to/pupil_time_chart.png" alt="Pupil Fluctuations" />
          </ReportCard>

          {/* 7. Mean Fixation Duration - ΝΕΟ */}
          <ReportCard 
            title="Mean Fixation Duration" 
            subtitle="Bar Chart – Average duration of gaze fixations"
          >
            <img src="/path/to/mean_fixation.png" alt="Mean Fixation" />
          </ReportCard>

        </div>
      </div>
    </div>
  );
};

export default Analytics;