import { useMemo } from "react";

function DrivingHours() {
  const dailyGoal = 8;
  const drivingHours = {
    today: 7,
    week: 41,
    month: 164,
  };

  const weeklyRecords = useMemo(() => {
    return [
      { day: "Monday", hours: 7, date: "2024-03-18" },
      { day: "Tuesday", hours: 9, date: "2024-03-19" },
      { day: "Wednesday", hours: 6, date: "2024-03-20" },
      { day: "Thursday", hours: 8, date: "2024-03-21" },
      { day: "Friday", hours: drivingHours.today, date: "2024-03-22" },
      { day: "Saturday", hours: 5, date: "2024-03-23" },
      { day: "Sunday", hours: 0, date: "2024-03-24" }
    ];
  }, [drivingHours.today]);

  const weeklyProgress = (drivingHours.week / 56) * 100; // 56 hours = 8 hours/day * 7 days
  const dailyProgress = (drivingHours.today / dailyGoal) * 100;

  return (
    <div className="hours-container">
      <div className="card">
        <h2>Driving Hours</h2>
        
        <div className="hours-overview">
          <div className="overview-item">
            <h3>Today</h3>
            <p className="hours">{drivingHours.today} hrs</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${dailyProgress}%`}}></div>
            </div>
            <small>Goal: {dailyGoal} hrs</small>
          </div>
          
          <div className="overview-item">
            <h3>This Week</h3>
            <p className="hours">{drivingHours.week} hrs</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${weeklyProgress}%`}}></div>
            </div>
            <small>Goal: 56 hrs</small>
          </div>
          
          <div className="overview-item">
            <h3>This Month</h3>
            <p className="hours">{drivingHours.month} hrs</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${(drivingHours.month / 240) * 100}%`}}></div>
            </div>
            <small>Goal: 240 hrs</small>
          </div>
        </div>

        <div className="weekly-records">
          <h3>Weekly Records</h3>
          <div className="records-table">
            {weeklyRecords.map((record, index) => (
              <div key={index} className="record-row">
                <span className="day">{record.day}</span>
                <span className="date">{record.date}</span>
                <span className="hours">{record.hours} hrs</span>
                <span className={`status ${record.hours >= 6 ? 'good' : 'low'}`}>
                  {record.hours >= 6 ? 'Good' : 'Low'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="hours-actions">
          <button className="action-btn">Start Driving Session</button>
          <button className="action-btn">Export Report</button>
        </div>
      </div>
    </div>
  );
}

export default DrivingHours;
