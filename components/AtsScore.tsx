import React from 'react';

interface AtsScoreProps {
  score: number;
  feedback: string[];
}

const AtsScore: React.FC<AtsScoreProps> = ({ score, feedback }) => {
  const circumference = 2 * Math.PI * 45; // 2 * pi * r
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 85) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }

  const getStrokeColor = () => {
    if (score >= 85) return 'stroke-blue-500';
    if (score >= 60) return 'stroke-yellow-500';
    return 'stroke-red-500';
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-slate-200">
      <h3 className="text-base font-semibold text-slate-800 mb-3">ATS Friendliness Score</h3>
      <div className="flex items-center space-x-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              className="text-slate-200 stroke-current"
              strokeWidth="10"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
            ></circle>
            {/* Progress circle */}
            <circle
              className={`${getStrokeColor()} stroke-current transition-all duration-1000 ease-in-out`}
              strokeWidth="10"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            ></circle>
            <text x="50" y="50" className={`text-2xl font-bold ${getScoreColor()}`} textAnchor="middle" dy=".3em">
              {score}
            </text>
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-slate-700">Actionable Feedback:</h4>
          <ul className="list-disc list-inside mt-2 text-sm text-slate-600 space-y-1">
            {(feedback || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AtsScore;