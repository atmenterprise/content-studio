-- Updating the parent row serializes concurrent writes even at REPEATABLE READ
-- (where a conflicting writer receives a serialization failure).
CREATE FUNCTION enforce_entry_singleton() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE singleton boolean;
BEGIN
  UPDATE schemas SET is_singleton = is_singleton
    WHERE id = NEW.schema_id AND site_id = NEW.site_id
    RETURNING is_singleton INTO singleton;
  IF singleton AND EXISTS (
    SELECT 1 FROM content_entries WHERE schema_id = NEW.schema_id AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'Singleton schema already contains an entry' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN NEW.updated_at = clock_timestamp(); END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER content_singleton_guard BEFORE INSERT OR UPDATE ON content_entries
  FOR EACH ROW EXECUTE FUNCTION enforce_entry_singleton();
CREATE FUNCTION enforce_schema_singleton() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_singleton AND NOT OLD.is_singleton AND
    (SELECT count(*) FROM content_entries WHERE schema_id = NEW.id) > 1 THEN
    RAISE EXCEPTION 'Collection has multiple entries' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER schema_singleton_guard BEFORE UPDATE OF is_singleton ON schemas
  FOR EACH ROW EXECUTE FUNCTION enforce_schema_singleton();
