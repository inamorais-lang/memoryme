-- The newspaper made the image model draw human hands. Drop it.
update public.personalities set image_prompt = 'Dress the pet in a bright yellow trench coat, a red fedora hat and dark sunglasses. Seat it at a sunny café terrace with colourful chairs and flowers, giving a suspicious side-eye to a smartphone lying on the table next to a cup of coffee.' where id in ('pt-ciumento', 'en-ciumento');
