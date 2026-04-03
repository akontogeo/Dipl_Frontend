import React from 'react';

const Analytics = () => {
  return (
    <div>
      {/* First card - unchanged */}
      <ReportCard title="Report Overview" subtitle="Overview of trends in pupil behavior">
        <img src="/path/to/report_pie.png" alt="Report Overview" />
      </ReportCard>

      {/* Updated second card */}
      <ReportCard title="Fixation Timeline" subtitle="Timeline Chart – Fixation events over time">
        <img src="/path/to/report_fixation_timeline.png" alt="Fixation Timeline" />
      </ReportCard>

      {/* Updated third card */}
      <ReportCard title="Time to First Fixation (Scientific)" subtitle="Bar Chart – TTFF per object (scientific notation)">
        <img src="/path/to/report_ttff_scientific.png" alt="Time to First Fixation (Scientific)" />
      </ReportCard>

      {/* Fourth card - unchanged */}
      <ReportCard title="Pupil Dynamics" subtitle="Dynamics of pupil behavior">
        <img src="/path/to/report_pupil.png" alt="Pupil Dynamics" />
      </ReportCard>
    </div>
  );
};

export default Analytics;