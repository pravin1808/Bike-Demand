import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudSun, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictDemand, checkStatus } from './api';
import './index.css';

const App = () => {
  const [formData, setFormData] = useState({
    temperature: 20,
    atemp: 20,
    humidity: 50,
    windspeed: 10,
    season: 1,
    month: 1,
    hour: 12,
    holiday: 0,
    weekday: 1,
    workingday: 1,
    weather_situation: 1,
    year: 2026
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState({ model_loaded: false, status: 'checking' });

  useEffect(() => {
    const getStatus = async () => {
      const status = await checkStatus();
      setServerStatus(status);
    };
    getStatus();
    const interval = setInterval(getStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setError(null);
    
    try {
      const result = await predictDemand(formData);
      if (result.status === 'success') {
        setPrediction(result.prediction);
      } else {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
        >
          <div className="glass" style={{ padding: '0.75rem', display: 'flex', borderRadius: '1rem' }}>
            <Bike size={32} className="gradient-text" style={{ color: '#3b82f6' }} />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '800' }}>BikeFlow AI</h1>
        </motion.div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Precision demand forecasting powered by advanced machine learning.
        </p>
        
        <div style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: serverStatus.model_loaded ? 'var(--accent)' : '#ef4444',
            boxShadow: `0 0 8px ${serverStatus.model_loaded ? 'var(--accent)' : '#ef4444'}`
          }}></div>
          <span style={{ color: 'var(--text-muted)' }}>
            System Status: {serverStatus.model_loaded ? 'Operational' : 'Disconnected'}
          </span>
        </div>
      </header>

      <div className="grid-cols-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
          style={{ padding: '2rem' }}
        >
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '1.5rem' }}>Configure Features</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Climate Group */}
              <section>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Environmental Conditions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <Thermometer size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Temp (°C)
                    </label>
                    <input type="number" name="temperature" value={formData.temperature} onChange={handleChange} step="0.1" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <Droplets size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Humidity (%)
                    </label>
                    <input type="number" name="humidity" value={formData.humidity} onChange={handleChange} max="100" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <Wind size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Wind (km/h)
                    </label>
                    <input type="number" name="windspeed" value={formData.windspeed} onChange={handleChange} step="0.1" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <CloudSun size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Weather
                    </label>
                    <select name="weather_situation" value={formData.weather_situation} onChange={handleChange}>
                      <option value="1">Clear / Few Clouds</option>
                      <option value="2">Mist + Cloudy</option>
                      <option value="3">Light Snow / Rain</option>
                      <option value="4">Heavy Rain / Ice Pallets</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Time Group */}
              <section>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>Temporal Factors</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Hour (0-23)
                    </label>
                    <input type="number" name="hour" value={formData.hour} onChange={handleChange} min="0" max="23" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Season
                    </label>
                    <select name="season" value={formData.season} onChange={handleChange}>
                      <option value="1">Spring</option>
                      <option value="2">Summer</option>
                      <option value="3">Fall</option>
                      <option value="4">Winter</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Working Day</label>
                    <select name="workingday" value={formData.workingday} onChange={handleChange}>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Holiday</label>
                    <select name="holiday" value={formData.holiday} onChange={handleChange}>
                      <option value="0">No</option>
                      <option value="1">Yes</option>
                    </select>
                  </div>
                </div>
              </section>

              <button 
                type="submit" 
                className="primary" 
                disabled={loading || !serverStatus.model_loaded}
                style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', height: '3.5rem', fontSize: '1.1rem' }}
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Predict Demand'}
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <div className="card" style={{ flex: 1, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Predictions</h2>
              <RefreshCw size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => { setPrediction(null); setError(null); }} />
            </div>

            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {prediction !== null ? (
                  <motion.div 
                    key="result"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    style={{ textAlign: 'center' }}
                  >
                    <div style={{ fontSize: '5rem', fontWeight: '800', lineHeight: 1 }} className="gradient-text">
                      {prediction}
                    </div>
                    <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Bikes per hour
                    </div>
                    <div className="glass" style={{ marginTop: '2rem', padding: '1rem 2rem', display: 'inline-block' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Confidence Level: High (R² ~ 0.93)
                      </span>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', color: '#ef4444' }}
                  >
                    <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                    <h3>Analysis Error</h3>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', color: 'var(--text-muted)' }}
                  >
                    <div className="glass" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                      <Bike size={40} opacity={0.3} />
                    </div>
                    <h3>Ready for Input</h3>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Configure conditions and click predict.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '0.75rem' }}>
              <CloudSun size={24} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pro Tip</div>
              <div style={{ fontSize: '0.95rem' }}>Temperature and Hour have the highest impact on bike demand.</div>
            </div>
          </div>
        </motion.div>
      </div>

      <footer style={{ marginTop: '4rem', paddingBottom: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>&copy; 2026 BikeFlow AI • Built with Vite, React & Scikit-Learn</p>
      </footer>
    </div>
  );
};

export default App;
