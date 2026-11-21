-- Reversión de 0028: elimina las tablas de Editar web (la web pública vuelve a servirse desde código).
DROP TABLE IF EXISTS `site_document_versions`;
DROP TABLE IF EXISTS `site_documents`;
DROP TABLE IF EXISTS `site_redirects`;
