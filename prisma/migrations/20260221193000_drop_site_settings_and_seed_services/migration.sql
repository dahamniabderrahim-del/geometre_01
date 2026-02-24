DROP TABLE IF EXISTS "site_settings";

INSERT INTO "services" ("title", "slug", "category", "description", "icon", "active", "sort_order") VALUES
  ('Bornage', 'bornage', 'Foncier', 'Delimitation officielle et contradictoire des proprietes. Bornage amiable ou judiciaire.', 'map_pin', true, 1),
  ('Division Parcellaire', 'division-parcellaire', 'Cadastre', 'Creation de nouveaux lots pour la vente, donation ou projet de construction.', 'file_text', true, 2),
  ('Copropriete', 'copropriete', 'Urbanisme', 'Etat descriptif de division, reglement de copropriete et mise en conformite.', 'building2', true, 3),
  ('Topographie', 'topographie', 'Topographie', 'Leves topographiques precis par GPS/GNSS et station totale.', 'ruler', true, 4),
  ('Implantation', 'implantation', 'Construction', 'Positionnement precis des constructions et ouvrages sur le terrain.', 'compass', true, 5),
  ('Expertise Fonciere', 'expertise-fonciere', 'Expertise', 'Conseil et expertise pour conflits de limites et contentieux.', 'file_check', true, 6),
  ('Photogrammetrie Drone', 'photogrammetrie-drone', 'Innovation', 'Leves aeriens par drone, orthophotos et modeles 3D.', 'plane', true, 7),
  ('Cubatures', 'cubatures', 'Topographie', 'Calculs de volumes deblais/remblais pour terrassement.', 'calculator', true, 8)
ON CONFLICT ("slug") DO NOTHING;
