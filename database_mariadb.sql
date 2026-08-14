-- MariaDB/MySQL Database Schema for Tv-rate-display-for-exchange
-- Run this script to create the database and all required tables

-- ============================================
-- Create Database
-- ============================================

CREATE DATABASE IF NOT EXISTS devi_jewellers
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE devi_jewellers;

-- ============================================
-- Table: gold_rates
-- Stores gold and silver exchange rates
-- ============================================

CREATE TABLE IF NOT EXISTS gold_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gold_24k_sale DECIMAL(12,2) NOT NULL,
    gold_24k_purchase DECIMAL(12,2) NOT NULL,
    gold_24k_exchange DECIMAL(12,2) DEFAULT 0,
    gold_22k_sale DECIMAL(12,2) NOT NULL,
    gold_22k_purchase DECIMAL(12,2) NOT NULL,
    gold_22k_exchange DECIMAL(12,2) DEFAULT 0,
    gold_18k_sale DECIMAL(12,2) NOT NULL,
    gold_18k_purchase DECIMAL(12,2) NOT NULL,
    gold_18k_exchange DECIMAL(12,2) DEFAULT 0,
    silver_per_kg_sale DECIMAL(12,2) NOT NULL,
    silver_per_kg_purchase DECIMAL(12,2) NOT NULL,
    silver_per_kg_exchange DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    source VARCHAR(50) DEFAULT 'api',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active),
    INDEX idx_created_date (created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: display_settings
-- TV display configuration
-- ============================================

CREATE TABLE IF NOT EXISTS display_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orientation VARCHAR(20) DEFAULT 'horizontal',
    background_color VARCHAR(20) DEFAULT '#FFF8E1',
    text_color VARCHAR(20) DEFAULT '#212529',
    rate_number_font_size VARCHAR(20) DEFAULT 'text-4xl',
    show_media BOOLEAN DEFAULT TRUE,
    rates_display_duration_seconds INT DEFAULT 15,
    refresh_interval INT DEFAULT 30,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default display settings
INSERT INTO display_settings (orientation, background_color, text_color) 
VALUES ('horizontal', '#FFF8E1', '#212529');

-- ============================================
-- Table: media_items
-- Media files (images/videos) for slideshow
-- ============================================

CREATE TABLE IF NOT EXISTS media_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_data LONGTEXT,
    media_type VARCHAR(20) NOT NULL,
    duration_seconds INT DEFAULT 30,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    file_size INT,
    mime_type VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_index (order_index),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: promo_images
-- Promotional images for slideshow
-- ============================================

CREATE TABLE IF NOT EXISTS promo_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    image_data LONGTEXT,
    duration_seconds INT DEFAULT 5,
    transition_effect VARCHAR(20) DEFAULT 'fade',
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    file_size INT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_index (order_index),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: banner_settings
-- Banner image configuration
-- ============================================

CREATE TABLE IF NOT EXISTS banner_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    banner_image_url TEXT,
    banner_image_data LONGTEXT,
    banner_height INT DEFAULT 120,
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default banner settings
INSERT INTO banner_settings (banner_height, is_active) VALUES (120, TRUE);

-- ============================================
-- Table: rate_settings
-- Rate calculation and API configuration
-- ============================================

CREATE TABLE IF NOT EXISTS rate_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    external_rates_url TEXT DEFAULT 'https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php',
    perc_24k_purchase DECIMAL(6,5) DEFAULT 0.985,
    perc_24k_exchange DECIMAL(6,5) DEFAULT 0.99,
    perc_22k_sale DECIMAL(6,5) DEFAULT 0.92,
    perc_22k_purchase DECIMAL(6,5) DEFAULT 0.90,
    perc_22k_exchange DECIMAL(6,5) DEFAULT 0.91,
    perc_18k_sale DECIMAL(6,5) DEFAULT 0.86,
    perc_18k_purchase DECIMAL(6,5) DEFAULT 0.80,
    perc_18k_exchange DECIMAL(6,5) DEFAULT 0.85,
    silver_purchase_offset DECIMAL(10,2) DEFAULT -5000,
    silver_exchange_offset DECIMAL(10,2) DEFAULT -3000,
    check_interval_minutes INT DEFAULT 5,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default rate settings
INSERT INTO rate_settings (
    external_rates_url,
    perc_24k_purchase,
    perc_24k_exchange,
    perc_22k_sale,
    perc_22k_purchase,
    perc_22k_exchange,
    perc_18k_sale,
    perc_18k_purchase,
    perc_18k_exchange,
    silver_purchase_offset,
    silver_exchange_offset,
    check_interval_minutes
) VALUES (
    'https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php',
    0.985, 0.99, 0.92, 0.90, 0.91, 0.86, 0.80, 0.85, -5000, -3000, 5
);

-- ============================================
-- Verify Tables
-- ============================================

SHOW TABLES;

-- ============================================
-- Sample Queries
-- ============================================

-- Get current active rates
-- SELECT * FROM gold_rates WHERE is_active = TRUE ORDER BY created_date DESC LIMIT 1;

-- Get all rate history
-- SELECT * FROM gold_rates ORDER BY created_date DESC;

-- Get display settings
-- SELECT * FROM display_settings LIMIT 1;

-- Get rate settings
-- SELECT * FROM rate_settings LIMIT 1;
