-- Fix subscription status check to include 'trialing' status
CREATE OR REPLACE FUNCTION public.get_current_ai_usage(p_user_id uuid)
RETURNS json AS $$
DECLARE
    usage_record public.ai_usage;
    has_subscription boolean;
BEGIN
    -- Check if user has active subscription (including trialing)
    SELECT EXISTS(
        SELECT 1 FROM public.subscriptions 
        WHERE user_id = p_user_id 
        AND (status = 'active' OR status = 'trialing')
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

-- Also fix the increment functions to include trialing status
CREATE OR REPLACE FUNCTION public.increment_ai_transcription(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    usage_record public.ai_usage;
    has_subscription boolean;
BEGIN
    -- Check if user has active subscription (including trialing)
    SELECT EXISTS(
        SELECT 1 FROM public.subscriptions 
        WHERE user_id = p_user_id 
        AND (status = 'active' OR status = 'trialing')
        AND (current_period_end IS NULL OR current_period_end > NOW())
    ) INTO has_subscription;
    
    -- If user has subscription, allow unlimited usage
    IF has_subscription THEN
        -- Get today's usage record
        SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
        
        -- Increment usage
        UPDATE public.ai_usage 
        SET ai_transcriptions = ai_transcriptions + 1
        WHERE id = usage_record.id;
        
        RETURN true;
    END IF;
    
    -- Get today's usage record
    SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
    
    -- Check if user has reached limit
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

CREATE OR REPLACE FUNCTION public.increment_ai_natural_input(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    usage_record public.ai_usage;
    has_subscription boolean;
BEGIN
    -- Check if user has active subscription (including trialing)
    SELECT EXISTS(
        SELECT 1 FROM public.subscriptions 
        WHERE user_id = p_user_id 
        AND (status = 'active' OR status = 'trialing')
        AND (current_period_end IS NULL OR current_period_end > NOW())
    ) INTO has_subscription;
    
    -- If user has subscription, allow unlimited usage
    IF has_subscription THEN
        -- Get today's usage record
        SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
        
        -- Increment usage
        UPDATE public.ai_usage 
        SET ai_natural_inputs = ai_natural_inputs + 1
        WHERE id = usage_record.id;
        
        RETURN true;
    END IF;
    
    -- Get today's usage record
    SELECT * INTO usage_record FROM public.get_or_create_ai_usage(p_user_id);
    
    -- Check if user has reached limit
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