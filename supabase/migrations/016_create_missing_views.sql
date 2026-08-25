-- ============================================================
-- PRIMA - Database Migration
-- File: 016_create_missing_views.sql
-- Deskripsi: Menambahkan views yang belum ada di migrasi sebelumnya 
--            (v_posts, v_ai_ready_dataset) agar sinkron dengan backup.sql
-- ============================================================

CREATE OR REPLACE VIEW public.v_ai_ready_dataset WITH (security_invoker='true') AS
 SELECT id,
    user_id,
    cycle_id,
    pond_id,
    pond_area_m2,
    pond_depth_m,
    pond_location,
    start_date,
    end_date,
    total_days,
    initial_shrimp_count,
    density_per_m2,
    harvest_biomass_kg,
    harvest_abw_gram,
    harvest_sr_pct,
    yield_kg_per_m2,
    total_feed_kg,
    final_fcr,
    avg_daily_feed_kg,
    total_feed_sessions,
    anco_habis_count,
    anco_sisa_sedikit_count,
    anco_sisa_banyak_count,
    anco_habis_pct,
    total_probiotic_sessions,
    total_probiotic_ml,
    total_samplings,
    abw_growth_rate,
    quality_score,
    quality_grade,
    is_approved_for_training,
    notes,
    created_at,
        CASE
            WHEN (harvest_biomass_kg > (0)::numeric) THEN round(((avg_daily_feed_kg / harvest_biomass_kg) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS avg_feeding_rate_pct
   FROM public.ai_training_data atd
  WHERE ((is_approved_for_training = true) AND (quality_grade = ANY (ARRAY['A'::text, 'B'::text])))
  ORDER BY quality_score DESC, created_at DESC;

COMMENT ON VIEW public.v_ai_ready_dataset IS 'Dataset BERSIH yang siap dipakai AI untuk mempelajari performa siklus sebelumnya. Hanya berisi data grade A dan B (siklus panen yang berhasil baik).';


CREATE OR REPLACE VIEW public.v_posts WITH (security_invoker='true') AS
 SELECT id,
    user_id,
    author_name,
    avatar_url,
    content,
    image_url,
    created_at,
    (( SELECT count(*) AS count
           FROM public.post_likes l
          WHERE (l.post_id = p.id)))::integer AS likes_count,
    (( SELECT count(*) AS count
           FROM public.post_comments c
          WHERE (c.post_id = p.id)))::integer AS comments_count
   FROM public.posts p;

