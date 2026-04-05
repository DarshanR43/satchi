import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { X } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_URL = import.meta.env.VITE_API_URL || '/api';

const StatsModal = ({ isOpen, onClose, event, api }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isOpen || !event) return;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const client = api || axios.create({ baseURL: API_URL });
        const resp = await client.get(`/api/event-stats/${event.id}/`);
        setData(resp.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isOpen, event]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full mt-12 p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Event Statistics — {event?.name}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
        </div>
        {loading && <p>Loading...</p>}
        {error && <div className="text-red-600">{error}</div>}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Participants (by gender)</h4>
              <Pie data={{ labels: data.genderChart.map(g => g.label), datasets: [{ data: data.genderChart.map(g => g.value), backgroundColor: ['#60A5FA', '#F472B6', '#A1A1AA'] }] }} />
              <div className="mt-3 text-sm text-gray-700">
                <p>Total participants: <strong>{data.participants.total}</strong></p>
                <p>Male: <strong>{data.participants.male}</strong>, Female: <strong>{data.participants.female}</strong></p>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Marks distribution</h4>
              {data.marksHistogram && data.marksHistogram.length > 0 ? (
                <Bar data={{ labels: data.marksHistogram.map(h => h.range), datasets: [{ label: 'Teams', data: data.marksHistogram.map(h => h.count), backgroundColor: '#FB923C' }] }} />
              ) : (
                <p className="text-sm text-gray-600">No marks available yet.</p>
              )}
              {data.marksStats && (
                <div className="mt-3 text-sm text-gray-700">
                  <p>Teams evaluated: <strong>{data.marksStats.count}</strong></p>
                  <p>Average: <strong>{Number(data.marksStats.avg).toFixed(2)}</strong></p>
                  <p>Min / Max: <strong>{data.marksStats.min} / {data.marksStats.max}</strong></p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Teams & Scores</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.teamsWithMarks && data.teamsWithMarks.length > 0 ? (
                  data.teamsWithMarks.map(t => (
                    <div key={t.projectId} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                      <div>
                        <div className="font-semibold text-gray-800">{t.teamName}</div>
                        <div className="text-xs text-gray-500">Project ID: {t.projectId}</div>
                      </div>
                      <div className="text-sm font-bold text-gray-800">{t.finalScore}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No teams evaluated yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsModal;
