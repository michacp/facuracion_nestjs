 
CREATE TABLE `brands` (
  `brands_id` int NOT NULL AUTO_INCREMENT,
  `brands_find_id` varchar(50) NOT NULL,
  `brands_name` varchar(255) NOT NULL,
  `brands_devices_count` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`brands_id`),
  UNIQUE KEY `brands_find_id` (`brands_find_id`),
  UNIQUE KEY `brands_name` (`brands_name`)
) ENGINE=InnoDB AUTO_INCREMENT=293 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `identificacion` varchar(20) NOT NULL,
  `tipo_identificacion` char(2) NOT NULL,
  `razon_social` varchar(150) NOT NULL,
  `direccion` text,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `es_consumidor_final` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `identificacion` (`identificacion`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `detalle_venta` (
  `detalle_id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `lote_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT '0.00',
  `tarifa_impuesto_id` int NOT NULL,
  PRIMARY KEY (`detalle_id`),
  KEY `lote_id` (`lote_id`),
  KEY `tarifa_impuesto_id` (`tarifa_impuesto_id`),
  KEY `detalle_factura_ibfk_1` (`venta_id`),
  CONSTRAINT `detalle_venta_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`venta_id`),
  CONSTRAINT `detalle_venta_ibfk_2` FOREIGN KEY (`lote_id`) REFERENCES `item_lotes` (`lote_id`),
  CONSTRAINT `detalle_venta_ibfk_3` FOREIGN KEY (`tarifa_impuesto_id`) REFERENCES `tarifa_impuesto` (`tarifa_impuesto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=576 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  
CREATE TABLE `empresas` (
  `empresas_id` int NOT NULL AUTO_INCREMENT,
  `empresas_razonSocial` varchar(255) NOT NULL,
  `empresas_nombreComercial` varchar(255) DEFAULT NULL,
  `empresas_ruc` char(13) NOT NULL,
  `empresas_dirMatriz` varchar(255) NOT NULL,
  `empresas_telefono` varchar(20) DEFAULT NULL,
  `empresa_email` varchar(100) NOT NULL,
  `empresas_obligadocontabilidad` tinyint(1) DEFAULT '0',
  `empresas_regimenes_id` int DEFAULT NULL,
  `empresas_agenteRetencion` tinyint(1) DEFAULT '0',
  `empresas_creadoEn` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`empresas_id`),
  UNIQUE KEY `empresas_ruc` (`empresas_ruc`),
  UNIQUE KEY `empresa_email` (`empresa_email`),
  KEY `fk_empresas_regimenes` (`empresas_regimenes_id`),
  CONSTRAINT `fk_empresas_regimenes` FOREIGN KEY (`empresas_regimenes_id`) REFERENCES `regimenes` (`regimenes_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `estado_sri` (
  `estado_sri_id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  PRIMARY KEY (`estado_sri_id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `estados_numeracion` (
  `estado_id` tinyint NOT NULL AUTO_INCREMENT,
  `estado_nombre` varchar(20) NOT NULL,
  PRIMARY KEY (`estado_id`),
  UNIQUE KEY `estado_nombre` (`estado_nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `facturas` (
  `factura_id` int NOT NULL AUTO_INCREMENT,
  `venta_id` int NOT NULL,
  `clave_acceso` varchar(49) NOT NULL,
  `estado_sri_id` int DEFAULT NULL,
  `mensaje_sri` text,
  `fecha_envio_sri` datetime DEFAULT NULL,
  `fecha_autorizacion` datetime DEFAULT NULL,
  `id_xml` text,
  `ambiente` tinyint DEFAULT '2',
  `usuario_emisor_id` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`factura_id`),
  UNIQUE KEY `clave_acceso` (`clave_acceso`),
  KEY `venta_id` (`venta_id`),
  KEY `estado_sri_id` (`estado_sri_id`),
  KEY `usuario_emisor_id` (`usuario_emisor_id`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`venta_id`),
  CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`estado_sri_id`) REFERENCES `estado_sri` (`estado_sri_id`),
  CONSTRAINT `facturas_ibfk_3` FOREIGN KEY (`usuario_emisor_id`) REFERENCES `usuarios` (`usuarios_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `facturas_numeracion` (
  `numeracion_id` bigint NOT NULL AUTO_INCREMENT,
  `sucursal_id` int NOT NULL,
  `numero` int NOT NULL,
  `estado_id` tinyint NOT NULL,
  `fecha_generacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`numeracion_id`),
  UNIQUE KEY `uk_sucursal_numero` (`sucursal_id`,`numero`),
  KEY `estado_id` (`estado_id`),
  CONSTRAINT `facturas_numeracion_ibfk_1` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`sucursales_id`),
  CONSTRAINT `facturas_numeracion_ibfk_2` FOREIGN KEY (`estado_id`) REFERENCES `estados_numeracion` (`estado_id`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `firmas` (
  `firmas_id` int NOT NULL AUTO_INCREMENT,
  `firmas_empresaId` int NOT NULL,
  `firmas_alias` varchar(100) DEFAULT NULL,
  `firmas_rutaArchivo` varchar(255) NOT NULL,
  `firmas_password` varchar(255) NOT NULL,
  `firmas_fechaEmision` date DEFAULT NULL,
  `firmas_fechaExpiracion` date DEFAULT NULL,
  `firmas_activa` tinyint(1) DEFAULT '1',
  `firmas_creadoEn` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`firmas_id`),
  KEY `firmas_empresaId` (`firmas_empresaId`),
  CONSTRAINT `firmas_ibfk_1` FOREIGN KEY (`firmas_empresaId`) REFERENCES `empresas` (`empresas_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `forma_pago` (
  `forma_pago_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(2) NOT NULL,
  PRIMARY KEY (`forma_pago_id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `item_lotes` (
  `lote_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `numero_lote` varchar(50) NOT NULL,
  `cantidad` int NOT NULL,
  `fecha_ingreso` datetime DEFAULT CURRENT_TIMESTAMP,
  `observaciones` text,
  PRIMARY KEY (`lote_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `item_lotes_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=564 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `item_modelo` (
  `item_modelo_id` int NOT NULL AUTO_INCREMENT,
  `item_id` int NOT NULL,
  `models_id` int NOT NULL,
  `compatibilidad_notas` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`item_modelo_id`),
  UNIQUE KEY `item_id` (`item_id`,`models_id`),
  KEY `models_id` (`models_id`),
  CONSTRAINT `item_modelo_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `item_modelo_ibfk_2` FOREIGN KEY (`models_id`) REFERENCES `models` (`models_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=601 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_codigo_principal` varchar(25) NOT NULL,
  `item_codigo_auxiliar` varchar(25) DEFAULT NULL,
  `tipo_item_id` int NOT NULL,
  `tarifa_impuesto_id` int NOT NULL,
  `item_nombre` varchar(100) NOT NULL,
  `item_descripcion` text,
  `item_precio_unitario` decimal(12,2) NOT NULL,
  `item_activo` tinyint(1) DEFAULT '1',
  `item_fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_fecha_actualizacion` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `item_codigo_principal` (`item_codigo_principal`),
  KEY `tipo_item_id` (`tipo_item_id`),
  KEY `tarifa_impuesto_id` (`tarifa_impuesto_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`tipo_item_id`) REFERENCES `tipo_item` (`tipo_item_id`),
  CONSTRAINT `items_ibfk_2` FOREIGN KEY (`tarifa_impuesto_id`) REFERENCES `tarifa_impuesto` (`tarifa_impuesto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=564 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `models` (
  `models_id` int NOT NULL AUTO_INCREMENT,
  `models_find_id` varchar(100) NOT NULL,
  `models_name` varchar(255) NOT NULL,
  `models_brands_id` int NOT NULL,
  `models_img_url` varchar(500) DEFAULT NULL,
  `models_description` text,
  PRIMARY KEY (`models_id`),
  UNIQUE KEY `models_find_id` (`models_find_id`),
  KEY `models_brands_id` (`models_brands_id`),
  CONSTRAINT `models_ibfk_1` FOREIGN KEY (`models_brands_id`) REFERENCES `brands` (`brands_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14418 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `regimenes` (
  `regimenes_id` int NOT NULL AUTO_INCREMENT,
  `regimenes_nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`regimenes_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `roles` (
  `rol_id` int NOT NULL AUTO_INCREMENT,
  `rol_nombre` varchar(50) NOT NULL,
  `rol_descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`rol_id`),
  UNIQUE KEY `rol_nombre` (`rol_nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `sucursales` (
  `sucursales_id` int NOT NULL AUTO_INCREMENT,
  `sucursales_empresaId` int NOT NULL,
  `sucursales_cod` varchar(20) NOT NULL DEFAULT '001',
  `sucursales_nombre` varchar(100) NOT NULL DEFAULT 'MATRIZ',
  `sucursales_direccion` varchar(255) NOT NULL,
  `sucursales_telefono` varchar(20) DEFAULT NULL,
  `sucursales_esMatriz` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`sucursales_id`),
  UNIQUE KEY `uk_empresa_cod` (`sucursales_empresaId`,`sucursales_cod`),
  CONSTRAINT `sucursales_ibfk_1` FOREIGN KEY (`sucursales_empresaId`) REFERENCES `empresas` (`empresas_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `tarifa_impuesto` (
  `tarifa_impuesto_id` int NOT NULL AUTO_INCREMENT,
  `tipo_impuesto_id` int NOT NULL,
  `tarifa_codigo_sri` varchar(2) NOT NULL,
  `tarifa_porcentaje` decimal(5,2) NOT NULL,
  `tarifa_nombre` varchar(50) NOT NULL,
  `tarifa_descripcion` varchar(100) NOT NULL,
  `tarifa_fecha_inicio` date NOT NULL,
  `tarifa_fecha_fin` date DEFAULT NULL,
  PRIMARY KEY (`tarifa_impuesto_id`),
  UNIQUE KEY `tipo_impuesto_id` (`tipo_impuesto_id`,`tarifa_codigo_sri`),
  CONSTRAINT `tarifa_impuesto_ibfk_1` FOREIGN KEY (`tipo_impuesto_id`) REFERENCES `tipo_impuesto` (`tipo_impuesto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `tipo_comprobante` (
  `tipo_comprobante_id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(2) NOT NULL,
  `abreviatura` varchar(45) NOT NULL,
  PRIMARY KEY (`tipo_comprobante_id`),
  UNIQUE KEY `codigo` (`codigo`),
  UNIQUE KEY `abreviatura_UNIQUE` (`abreviatura`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `tipo_identificacion_sri` (
  `codigo` char(2) NOT NULL,
  `descripcion` varchar(50) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `tipo_impuesto` (
  `tipo_impuesto_id` int NOT NULL AUTO_INCREMENT,
  `tipo_impuesto_codigo_sri` varchar(2) NOT NULL,
  `tipo_impuesto_nombre` varchar(50) NOT NULL,
  `tipo_impuesto_descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`tipo_impuesto_id`),
  UNIQUE KEY `tipo_impuesto_codigo_sri` (`tipo_impuesto_codigo_sri`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `tipo_item` (
  `tipo_item_id` int NOT NULL AUTO_INCREMENT,
  `tipo_item_nombre` varchar(50) NOT NULL,
  `tipo_item_descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`tipo_item_id`),
  UNIQUE KEY `tipo_item_nombre` (`tipo_item_nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `usuario_empresa` (
  `usuario_empresa_id` int NOT NULL AUTO_INCREMENT,
  `usuario_empresa_usuarioId` int NOT NULL,
  `usuario_empresa_empresaId` int NOT NULL,
  `usuario_empresa_codEmi` varchar(20) NOT NULL DEFAULT '001',
  `usuario_empresa_rolId` int NOT NULL,
  `fecha_asignacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuario_empresa_id`),
  UNIQUE KEY `uk_usuario_empresa` (`usuario_empresa_usuarioId`,`usuario_empresa_empresaId`),
  KEY `usuario_empresa_empresaId` (`usuario_empresa_empresaId`),
  KEY `usuario_empresa_rolId` (`usuario_empresa_rolId`),
  CONSTRAINT `usuario_empresa_ibfk_1` FOREIGN KEY (`usuario_empresa_usuarioId`) REFERENCES `usuarios` (`usuarios_id`),
  CONSTRAINT `usuario_empresa_ibfk_2` FOREIGN KEY (`usuario_empresa_empresaId`) REFERENCES `empresas` (`empresas_id`),
  CONSTRAINT `usuario_empresa_ibfk_3` FOREIGN KEY (`usuario_empresa_rolId`) REFERENCES `roles` (`rol_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `usuarios` (
  `usuarios_id` int NOT NULL AUTO_INCREMENT,
  `usuarios_username` varchar(50) NOT NULL,
  `usuarios_nombre` varchar(100) NOT NULL,
  `usuarios_email` varchar(100) NOT NULL,
  `usuarios_password` varchar(255) NOT NULL,
  `usuarios_activo` tinyint(1) DEFAULT '0',
  `usuarios_creadoEn` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`usuarios_id`),
  UNIQUE KEY `usuarios_username` (`usuarios_username`),
  UNIQUE KEY `usuarios_email` (`usuarios_email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 
CREATE TABLE `ventas` (
  `venta_id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `fecha_emision` timestamp NOT NULL,
  `tipo_comprobante_id` int NOT NULL,
  `moneda` varchar(3) NOT NULL DEFAULT 'USD',
  `forma_pago_id` int NOT NULL,
  `plazo_pago` varchar(20) DEFAULT NULL,
  `observaciones` text,
  `subtotal` decimal(10,2) NOT NULL,
  `descuento_total` decimal(10,2) DEFAULT '0.00',
  `iva` decimal(10,2) DEFAULT '0.00',
  `propina` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `numero_venta` varchar(45) NOT NULL,
  `ventas_usuario_id` int DEFAULT NULL,
  `ventas_sucursales_id` int DEFAULT NULL,
  PRIMARY KEY (`venta_id`),
  UNIQUE KEY `numero_venta_UNIQUE` (`numero_venta`),
  KEY `cliente_id` (`cliente_id`),
  KEY `tipo_comprobante_id` (`tipo_comprobante_id`),
  KEY `forma_pago_id` (`forma_pago_id`),
  KEY `fk_ventas_usuarios` (`ventas_usuario_id`),
  KEY `fk_ventas_sucursales` (`ventas_sucursales_id`),
  CONSTRAINT `fk_ventas_sucursales` FOREIGN KEY (`ventas_sucursales_id`) REFERENCES `sucursales` (`sucursales_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ventas_usuarios` FOREIGN KEY (`ventas_usuario_id`) REFERENCES `usuarios` (`usuarios_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`tipo_comprobante_id`) REFERENCES `tipo_comprobante` (`tipo_comprobante_id`),
  CONSTRAINT `ventas_ibfk_3` FOREIGN KEY (`forma_pago_id`) REFERENCES `forma_pago` (`forma_pago_id`)
) ENGINE=InnoDB AUTO_INCREMENT=578 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
 