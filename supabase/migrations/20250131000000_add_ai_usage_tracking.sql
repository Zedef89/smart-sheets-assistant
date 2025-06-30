-- Create AI usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    usage_date date NOT NULL DEFAULT CURRENT_DATE,
    ai_transcriptions integer NOT NULL DEFAULT 0,
    ai_natural_inputs integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one record per user per day
    UNIQUE(user_id, usage_date)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_date_idx ON public.ai_usage(usage_date);
CREATE INDEX IF NOT EXISTS ai_usage_user_date_idx ON public.ai_usage(user_id, usage_date);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own AI usage" ON public.ai_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI usage" ON public.ai_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI usage" ON public.ai_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_ai_usage_updated_at
    BEFORE UPDATE ON public.ai_usage
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to get or create today's usage record
CREATE OR REPLACE FUNCTION public.get_or_create_ai_usage(p_user_id uuid)
RETURNS public.ai_usage AS $$
DECLARE
    usage_record public.ai_usage;
BEGIN
    -- Try to get existing record for today
    SELECT * INTO usage_record
    FROM public.ai_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.ai_usage (user_id, usage_date)
        VALUES (p_user_id, CURRENT_DATE)
        RETURNING * INTO usage_record;
    END IF;
    
    RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment AI transcription usage
CREATE OR REPLACE FUNCTION public.increment_ai_transcription(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    usage_record public.ai_usage;
    has_subscription boolean;
BEGIN
    -- Check if user has active subscription
    SELECT EXISTS(
        SELECT 1 FROM public.subscriptions 
        WHERE user_id = p_user_id 
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > NOW())
    ) INTO has_subscription;
    
    -- If user has subscription, allow unlimited usage
    IF has_subscription THEN
        -- Still track usage for analytics
        SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
        UPDATE public.ai_usage 
        SET ai_transcriptions = ai_transcriptions + 1
        WHERE id = usage_record.id;
        RETURN true;
    END IF;
    
    -- Get or create today's usage record
    SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
    
    -- Check if user has reached daily limit (2 transcriptions)
    IF usage_record.ai_transcriptions >= 2 THEN
        RETURN false;
    END IF;
    
    -- Increment usage
    UPDATE public.ai_usage 
    SET ai_transcriptions = ai_transcriptions + 1
    WHERE id = usage_record.id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment AI natural input usage
CREATE OR REPLACE FUNCTION public.increment_ai_natural_input(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    usage_record public.ai_usage;
    has_subscription boolean;
BEGIN
    -- Check if user has active subscription
    SELECT EXISTS(
        SELECT 1 FROM public.subscriptions 
        WHERE user_id = p_user_id 
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > NOW())
    ) INTO has_subscription;
    
    -- If user has subscription, allow unlimited usage
    IF has_subscription THEN
        -- Still track usage for analytics
        SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
        UPDATE public.ai_usage 
        SET ai_natural_inputs = ai_natural_inputs + 1
        WHERE id = usage_record.id;
        RETURN true;
    END IF;
    
    -- Get or create today's usage record
    SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
    
    -- Check if user has reached daily limit (2 natural inputs)
    IF usage_record.ai_natural_inputs >= 2 THEN
        RETURN false;
    END IF;
    
    -- Increment usage
    UPDATE public.ai_usage 
    SET ai_natural_inputs = ai_natural_inputs + 1
    WHERE id = usage_record.id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current usage for a user
CREATE OR REPLACE FUNCTION public.get_current_ai_usage(p_user_id uuid)
RETURNS json AS $$
DECLARE
    usage_record public.ai_usage;
    has_subscription boolean;
BEGIN
    -- Check if user has active subscription
    SELECT EXISTS(
        SELECT 1 FROM public.subscriptions 
        WHERE user_id = p_user_id 
        AND status = 'active'
        AND (current_period_end IS NULL OR current_period_end > NOW())
    ) INTO has_subscription;
    
    -- Get today's usage record
    SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
    
    RETURN json_build_object(
        'ai_transcriptions', COALESCE(usage_record.ai_transcriptions, 0),
        'ai_natural_inputs', COALESCE(usage_record.ai_natural_inputs, 0),
        'has_subscription', has_subscription,
        'can_use_transcription', has_subscription OR COALESCE(usage_record.ai_transcriptions, 0) < 2,
        'can_use_natural_input', has_subscription OR COALESCE(usage_record.ai_natural_inputs, 0) < 2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;