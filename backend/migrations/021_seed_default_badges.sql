INSERT INTO badges (id, name, description, image_url, criteria)
VALUES
    (
        'first-step',
        'Langkah Pertama',
        'Kumpulkan 10 poin pertamamu.',
        '',
        '{"type":"points","min_points":10}'::jsonb
    ),
    (
        'sobi-friend',
        'Teman Sobi',
        'Mulai obrolan belajar dengan Sobi.',
        '',
        '{"type":"activity","activity_type":"chat_message","min_count":1}'::jsonb
    ),
    (
        'question-solver',
        'Jago Jelasin',
        'Gunakan fitur Jelasin Soal minimal 1 kali.',
        '',
        '{"type":"activity","activity_type":"explain_question","min_count":1}'::jsonb
    ),
    (
        'practice-starter',
        'Mulai Latihan',
        'Selesaikan sesi latihan pertamamu.',
        '',
        '{"type":"activity","activity_type":"practice_completion","min_count":1}'::jsonb
    ),
    (
        'summary-maker',
        'Perangkum Hebat',
        'Buat rangkuman materi pertamamu.',
        '',
        '{"type":"activity","activity_type":"create_summary","min_count":1}'::jsonb
    ),
    (
        'point-hunter',
        'Pemburu Poin',
        'Kumpulkan total 100 poin.',
        '',
        '{"type":"points","min_points":100}'::jsonb
    ),
    (
        'study-hero',
        'Pahlawan Belajar',
        'Kumpulkan total 300 poin.',
        '',
        '{"type":"points","min_points":300}'::jsonb
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    criteria = EXCLUDED.criteria;
