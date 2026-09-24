const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!openai) {
      return res.json({ 
        response: "❌ AI Ассистент недоступен. Добавьте OPENAI_API_KEY в конфигурацию." 
      });
    }

    const systemContext = `Ты - AI ассистент TEX-MEX, календаря-расписания для студентов.
    
Твои возможности:
- Помогать с расписанием пар
- Отвечать на вопросы о домашних заданиях
- Давать советы по организации учёбы
- Помогать планировать время

Контекст пользователя: ${JSON.stringify(context || {})}

Отвечай кратко, дружелюбно и по делу на русском языке. Используй **жирный шрифт** для важных слов.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    res.json({ response });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      error: 'Произошла ошибка при обработке сообщения',
      response: "❌ Произошла ошибка. Попробуйте ещё раз."
    });
  }
});

// Execute command endpoint
router.post('/execute-command', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!openai) {
      return res.json({ response: "❌ OpenAI API не настроен" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Ты - AI ассистент TEX-MEX. Пользователь просит выполнить действие с расписанием или ДЗ.
          
Контекст: ${JSON.stringify(context)}

Если пользователь хочет добавить ДЗ, ответь в формате:
{"action": "add_homework", "subject": "Предмет", "description": "Описание", "due_date": "YYYY-MM-DD или null"}

Если хочет добавить пару:
{"action": "add_lesson", "day_of_week": 1, "lesson_order": 1, "subject": "Предмет", "room": "Аудитория", "teacher": "Преподаватель"}

Если хочешь изменить расписание:
{"action": "modify_schedule", "response": "текст ответа"}

Всегда отвечай в JSON формате с полем "response" для текста.`
        },
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(completion.choices[0].message.content);
    res.json(data);

  } catch (error) {
    console.error('Command Error:', error);
    res.json({ response: "❌ Не удалось выполнить команду. Попробуйте другими словами." });
  }
});

// Analyze photo endpoint
router.post('/analyze-photo', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!openai) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Проанализируй это фото. Это может быть:
1. Домашнее задание
2. Расписание

Если это ДЗ, верни: {"homework": {"subject": "предмет", "description": "описание", "due_date": "YYYY-MM-DD или null"}}
Если это расписание, верни: {"schedule": [{"day_of_week": 1, "lesson_order": 1, "subject": "предмет", "room": "аудитория", "teacher": "преподаватель"}]}
Если не понятно, верни: {"error": "описание проблемы"}

Дни недели: 0=Воскресенье, 1=Понедельник, 2=Вторник, 3=Среда, 4=Четверг, 5=Пятница, 6=Суббота`
            },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return res.status(400).json({ error: 'Не удалось распознать данные' });
    }
    
    res.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error('Photo analysis error:', error);
    res.status(500).json({ error: 'Ошибка при анализе фото' });
  }
});

// Scan schedule from photo
router.post('/scan-schedule', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!openai) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Проанализируй это фото расписания и извлеки информацию о парах.
              
Верни ответ ТОЛЬКО в формате JSON массива:
[
  {
    "day_of_week": 1,
    "lesson_order": 1,
    "subject": "Название предмета",
    "room": "Аудитория",
    "teacher": "Имя преподавателя",
    "time_start": "09:00",
    "time_end": "10:30"
  }
]

Дни недели: 0=Воскресенье, 1=Понедельник, 2=Вторник, 3=Среда, 4=Четверг, 5=Пятница, 6=Суббота

Если не можешь распознать расписание, верни: {"error": "описание проблемы"}`
            },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }
      ],
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        const errorMatch = content.match(/\{[\s\S]*"error"[\s\S]*\}/);
        if (errorMatch) {
          return res.status(400).json(JSON.parse(errorMatch[0]));
        }
        return res.status(400).json({ error: 'Не удалось распознать расписание' });
      }
      
      const schedule = JSON.parse(jsonMatch[0]);
      res.json({ schedule });
    } catch (parseError) {
      res.status(400).json({ error: 'Ошибка при распознавании данных' });
    }

  } catch (error) {
    console.error('Schedule scan error:', error);
    res.status(500).json({ error: 'Ошибка при сканировании расписания' });
  }
});

module.exports = router;
