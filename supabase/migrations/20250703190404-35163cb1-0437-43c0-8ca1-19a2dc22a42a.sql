-- Security fix: Update handle_new_user function to prevent function hijacking
-- Set search_path to empty string and use fully qualified schema references

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Insert new profile with fully qualified schema reference
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;