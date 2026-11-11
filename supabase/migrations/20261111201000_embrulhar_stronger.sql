-- First test: the pet sat next to the gifts instead of being caught in the wrapping.
update public.scenes set image_prompt =
  'The pet is wrapped up like a present: shiny red and gold wrapping paper wrapped loosely around its body, curly ribbons tangled around its legs and a big bow on its head, '
  || 'surrounded by half-wrapped boxes, scissors-free rolls of colourful paper and bows on the floor, with a slightly guilty look. Bright and cheerful.'
where id in ('pt-embrulhar', 'en-embrulhar');
