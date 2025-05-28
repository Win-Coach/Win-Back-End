const axios = require('axios');

exports.analyzeTrainingLog = async (req, res) => {
  const { training_content, feedback, next_goal } = req.body;

  try {
    const response = await axios.post('http://144.24.93.117:8000/analyze', {
      training_content,
      feedback,
      next_goal
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('FastAPI 요청 실패:', error.message);
    res.status(500).json({ error: '분석 서버 요청 실패' });
  }
};