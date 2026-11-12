-- The market's tone named sausages, and the line talked about sausages that were not in the picture.
update public.scenes set voice_prompt =
  'A pet at a Christmas market: unimpressed by the lights and the crowd, only cares about what it can eat, sniff or knock over in front of it, and judges the human''s festive spirit.'
where id like '%-mercado-natal';
