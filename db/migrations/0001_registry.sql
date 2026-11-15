CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, domain text NOT NULL, repo_url text NOT NULL,
  webhook_url text, api_key text NOT NULL, auth0_org_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sites_org_domain_unique UNIQUE (auth0_org_id, domain)
);
CREATE INDEX sites_org_idx ON sites(auth0_org_id);
CREATE TABLE schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
  collection_key text NOT NULL, label text NOT NULL,
  is_singleton boolean NOT NULL DEFAULT false, spec_definition jsonb NOT NULL,
  CONSTRAINT schemas_site_key_unique UNIQUE (site_id, collection_key),
  CONSTRAINT schemas_site_id_unique UNIQUE (site_id, id)
);
CREATE INDEX schemas_site_idx ON schemas(site_id);
CREATE TABLE content_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
  schema_id uuid NOT NULL, slug text NOT NULL, data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft', updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entries_site_schema_fk FOREIGN KEY(site_id, schema_id) REFERENCES schemas(site_id, id) ON DELETE RESTRICT,
  CONSTRAINT entries_schema_slug_unique UNIQUE(schema_id, slug),
  CONSTRAINT entries_status_check CHECK(status IN ('draft','published'))
);
CREATE INDEX entries_site_schema_idx ON content_entries(site_id, schema_id);
