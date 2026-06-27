<?php
/**
 * DAISY DECOR — Cinematic Interior Experience
 * PHP entry point & AJAX contact form handler
 */

// ── AJAX Contact Form Handler ─────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && !empty($_SERVER['HTTP_X_REQUESTED_WITH'])
    && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
) {
    header('Content-Type: application/json; charset=UTF-8');

    $name    = trim($_POST['name']    ?? '');
    $email   = trim($_POST['email']   ?? '');
    $service = trim($_POST['service'] ?? '');
    $vision  = trim($_POST['vision']  ?? '');

    $errors = [];
    if (empty($name))                                      $errors[] = 'Your name is required.';
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL))
                                                           $errors[] = 'A valid email address is required.';
    if (empty($vision))                                    $errors[] = 'Please describe your vision.';

    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    /*  In production — uncomment and configure:
    $headers  = "From: $name <$email>\r\nReply-To: $email\r\nContent-Type: text/plain";
    $subject  = "New Enquiry from $name" . ($service ? " — $service" : '');
    $body     = "Name: $name\nEmail: $email\nService: $service\n\n$vision";
    mail('hello@daisydecor.com', $subject, $body, $headers);
    */

    echo json_encode([
        'success' => true,
        'message' => 'Your enquiry has been received. We will be in touch within 24 hours.',
    ]);
    exit;
}

// ── Room Definitions ──────────────────────────────────────────────────────────
$rooms = [
    ['id' => 'hero',     'img' => '1-hero-wall.jpeg',         'data_room' => 0],
    ['id' => 'about',    'img' => '7-who-we-are.jpeg',        'data_room' => 1],
    ['id' => 'services', 'img' => '2-service-wall.jpeg',      'data_room' => 2],
    ['id' => 'projects', 'img' => '3-projects-wall.jpeg',     'data_room' => 3],
    ['id' => 'whyus',    'img' => '4-why-chooseus-wall.jpeg', 'data_room' => 4],
    ['id' => 'gallery',  'img' => '5-gallery-wall.jpeg',      'data_room' => 5],
    ['id' => 'contact',  'img' => '6-contact-wall.jpeg',      'data_room' => 6],
];

$room_nav_labels = ['Welcome', 'About', 'Services', 'Products', 'Why Us', 'Gallery', 'Contact'];
$current_year = date('Y');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daisy Decor — Bespoke Wall Finishing &amp; Interior Cladding</title>
  <meta name="description" content="Daisy Decor crafts extraordinary wall finishing experiences — Art Deco panels, sculpted stone, wood cladding, and marble. Walk through our showroom.">
  <meta name="keywords" content="luxury wall finishing, interior cladding, marble walls, wood slat, stone cladding, bespoke panels, Art Deco, Dubai, London">
  <meta property="og:title" content="Daisy Decor — Bespoke Wall Finishing">
  <meta property="og:description" content="A cinematic journey through luxury wall finishing. Every surface, a signature.">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="preload" as="image" href="assets/images/1-hero-wall.jpeg">
  <link rel="stylesheet" href="style.css?v=<?= filemtime('style.css'); ?>">
</head>
<body>

<!-- ═══ FILM GRAIN ═══════════════════════════════════════════════════════════ -->
<div class="noise" aria-hidden="true"></div>



<!-- ═══ LOADER ═══════════════════════════════════════════════════════════════ -->
<div class="loader" id="loader" aria-hidden="true">
  <div class="loader-bg">
    <img src="assets/images/1-hero-wall.jpeg" alt="" aria-hidden="true">
    <div class="loader-bg-overlay"></div>
  </div>
  <div class="loader-content">
    <div class="loader-ornament">
      <span class="ornament-line"></span>
      <span class="ornament-diamond">◆</span>
      <span class="ornament-line"></span>
    </div>
    <div class="loader-brand">
      <div class="loader-word-wrap">
        <span class="loader-char">D</span>
        <span class="loader-char">A</span>
        <span class="loader-char">I</span>
        <span class="loader-char">S</span>
        <span class="loader-char">Y</span>
        <span class="loader-char">&nbsp;</span>
        <span class="loader-char">D</span>
        <span class="loader-char">E</span>
        <span class="loader-char">C</span>
        <span class="loader-char">O</span>
        <span class="loader-char">R</span>
      </div>
      <span class="loader-sub">WALL FINISHING STUDIO</span>
    </div>
    <div class="loader-tagline">Bespoke Wall Finishing Studio</div>
    <div class="loader-progress-wrap">
      <div class="loader-progress">
        <div class="loader-bar" id="loader-bar"></div>
      </div>
      <span class="loader-pct" id="loader-pct">0%</span>
    </div>
  </div>
</div>

<!-- ═══ NAVBAR ════════════════════════════════════════════════════════════════ -->
<nav class="navbar" id="navbar" aria-label="Main navigation">
  <div class="nav-inner">
    <a href="#room-hero" class="nav-logo" id="nav-logo-link" aria-label="Daisy Decor — Home">
      <img src="assets/images/logo.png" alt="Daisy Decor Logo" class="nav-logo-img" />
    </a>
    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-menu">
      <span></span>
      <span></span>
    </button>
    <ul class="nav-menu" id="nav-menu" role="list">
      <li><a href="#room-services" class="nav-link" data-room="2">Services</a></li>
      <li><a href="#room-products" class="nav-link" data-room="3">Products</a></li>
      <li><a href="#room-about"    class="nav-link" data-room="1">About</a></li>
      <li><a href="#room-gallery"  class="nav-link" data-room="5">Gallery</a></li>
      <li><a href="#room-contact"  class="nav-link nav-link--cta" data-room="6">Enquire</a></li>
    </ul>
  </div>
</nav>

<!-- ═══ ROOM PROGRESS INDICATORS ════════════════════════════════════════════ -->
<div class="room-nav" id="room-nav" aria-label="Section navigation">
  <?php foreach ($room_nav_labels as $i => $label): ?>
  <button class="room-dot" id="dot-<?= $i ?>" data-room-index="<?= $i ?>"
          aria-label="Go to <?= htmlspecialchars($label) ?> section">
    <span class="rd-pip"></span>
    <span class="rd-label"><?= htmlspecialchars($label) ?></span>
  </button>
  <?php endforeach; ?>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOM 1 — HERO
     Image: 1-hero-wall.jpeg  |  Art Deco gold/black wall + arch doorway left-center
     Doorway focal point: 33% 55%
     ═══════════════════════════════════════════════════════════════════════════ -->
<section class="room" id="room-hero" data-room="0">
  <div class="room-bg">
    <img
      src="assets/images/1-hero-wall.jpeg"
      alt="Art Deco gold and charcoal geometric patterned feature wall with an arched doorway in a luxury interior"
      class="room-bg-img"
      data-origin="33% 55%"
      loading="eager"
      fetchpriority="high"
    >
    <div class="room-vignette room-vignette--hero"></div>
    <div class="room-curtain" aria-hidden="true"></div>
  </div>

  <div class="room-content rc--center" id="hero-content">
    <div class="hero-eyebrow">
      <span class="he-line"></span>
      Bespoke Wall Finishing Studio
      <span class="he-line"></span>
    </div>
    <h1 class="hero-title">
      Walk Through<br>
      <em>Walls of Wonder</em>
    </h1>
    <p class="hero-subtitle">
      We transform surfaces into signature statements.<br>
      From Art Deco geometry to sculpted stone — every wall we craft<br>
      becomes a defining moment in a space.
    </p>
    <div class="hero-ctas">
      <a href="#room-products" class="btn btn-gold" id="hero-btn-products">Explore Our Work</a>
      <a href="#room-services" class="btn btn-ghost" id="hero-btn-services">Our Services</a>
    </div>
    <div class="hero-scroll-cue" aria-hidden="true">
      <span class="hsc-line"></span>
      <span class="hsc-text">Scroll to Enter</span>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOM 1.5 — WHO WE ARE
     Image: 7-who-we-are.jpeg
     ═══════════════════════════════════════════════════════════════════════════ -->
<section class="room" id="room-about" data-room="1">
  <div class="room-bg">
    <img
      src="assets/images/7-who-we-are.jpeg"
      alt="Luxury modern home interior with stylish furniture and warm architectural lighting"
      class="room-bg-img"
      loading="lazy"
    >
    <div class="room-vignette room-vignette--right"></div>
  </div>

  <div class="room-content rc--split" id="about-content">
    <!-- Left Column: Catalog -->
    <div class="about-catalog">
      <h3 class="catalog-heading">Catalogs</h3>
      <div class="catalog-cards">
        <div class="catalog-item">
          <div class="glass-panel catalog-panel" id="cat-panel-1">
            <div class="cc-image-wrap">
              <img src="assets/images/catalog-1.jpg" alt="Wallpaper Catalog 1" />
            </div>
          </div>
          <a href="#room-contact" class="btn cc-btn">View Catalog</a>
        </div>
        <div class="catalog-item">
          <div class="glass-panel catalog-panel" id="cat-panel-2">
            <div class="cc-image-wrap">
              <img src="assets/images/catalog-2.jpg" alt="Wallpaper Catalog 2" />
            </div>
          </div>
          <a href="#room-contact" class="btn cc-btn">View Catalog</a>
        </div>
      </div>
    </div>

    <!-- Right Column: Text Panel -->
    <div class="about-info-wrap">
      <div class="glass-panel" id="about-panel">
        <p class="section-eyebrow">Who We Are</p>
        <h2 class="section-title">Daisy Decor</h2>
        <div class="about-paragraphs">
          <p class="panel-desc">
            Daisy Decor is a trusted provider of premium home décor and interior solutions, dedicated to enhancing living and working spaces with elegant, modern, and functional designs.
          </p>
          <p class="panel-desc">
            Our extensive collection includes 3D wallpapers, customized wallpapers, sticker wallpapers, window blinds, PVC flooring, false ceilings, WPC panels, artificial grass, PVC Furniture, glass films, and a wide range of innovative interior décor products.
          </p>
          <p class="panel-desc">
            Beyond offering high-quality products, Daisy Decor provides expert guidance and personalized recommendations to ensure every space reflects comfort, style, and lasting beauty. Our focus is on quality craftsmanship and complete customer satisfaction.
          </p>
        </div>
        <a href="#room-contact" class="btn btn-ghost about-contact-btn">Contact Us</a>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOM 2 — SERVICES
     Image: 2-service-wall.jpeg  |  Warm walnut wood slat wall + console + corridor right
     Doorway focal point: 82% 50%
     ═══════════════════════════════════════════════════════════════════════════ -->
<section class="room" id="room-services" data-room="2">
  <div class="room-bg">
    <img
      src="assets/images/2-service-wall.jpeg"
      alt="Warm walnut wood slat feature wall with a console table in a modern luxury corridor"
      class="room-bg-img"
      data-origin="82% 50%"
      loading="lazy"
    >
    <div class="room-vignette room-vignette--left"></div>
    <div class="room-curtain" aria-hidden="true"></div>
  </div>

  <div class="room-content rc--split" id="services-content">
    <!-- Left Column: Filters Sidebar -->
    <div class="services-sidebar-wrap">
      <div class="glass-panel" id="services-filter-panel">
        <p class="section-eyebrow">Services</p>
        <h2 class="section-title">Categories</h2>
        <div class="filter-list">
          <button class="filter-btn is-active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="wallpaper">Wallpaper</button>
          <button class="filter-btn" data-filter="customized-wallpaper">Customized Wallpaper</button>
          <button class="filter-btn" data-filter="marble-sheet">Marble Sheet</button>
          <button class="filter-btn" data-filter="foam-sheet">Foam Sheet</button>
          <button class="filter-btn" data-filter="flooring-sheet">Flooring Sheet</button>
          <button class="filter-btn" data-filter="carpet">Carpet</button>
          <button class="filter-btn" data-filter="pu-stone">PU Stone</button>
          <button class="filter-btn" data-filter="3d-wall-panel">3D Wall Panel</button>
          <button class="filter-btn" data-filter="mosaic-acrylic">Mosaic Acrylic</button>
          <button class="filter-btn" data-filter="pvc-wpc">PVC / WPC</button>
          <button class="filter-btn" data-filter="glass-film">Glass Film</button>
          <button class="filter-btn" data-filter="moulding">Moulding</button>
          <button class="filter-btn" data-filter="mosaic-glass">Mosaic Glass</button>
          <button class="filter-btn" data-filter="grass">Grass</button>
        </div>
      </div>
    </div>

    <!-- Right Column: Services Grid -->
    <div class="services-grid-wrap">
      <div class="glass-panel" id="services-items-panel">
        <div class="services-scroll-container">
          <div class="services-grid" id="services-grid">
            <?php
            $catMap = [
                's1' => 'wallpaper', 's2' => 'wallpaper', 's3' => 'wallpaper',
                's4' => 'customized-wallpaper', 's5' => 'customized-wallpaper', 's6' => 'customized-wallpaper',
                's7' => 'marble-sheet', 's8' => 'marble-sheet',
                's10' => 'foam-sheet', 's28' => 'foam-sheet',
                's26' => 'flooring-sheet', 's27' => 'flooring-sheet',
                's24' => 'carpet', 's25' => 'carpet',
                's22' => 'grass', 's23' => 'grass',
                's20' => 'pu-stone', 's21' => 'pu-stone',
                's18' => '3d-wall-panel', 's19' => '3d-wall-panel',
                's16' => 'mosaic-acrylic', 's17' => 'mosaic-acrylic',
                's11' => 'mosaic-glass', 's12' => 'mosaic-glass',
                's13' => 'pvc-wpc', 's14' => 'pvc-wpc',
                's9' => 'glass-film', 's15' => 'glass-film',
                's29' => 'moulding', 's30' => 'moulding',
                's31' => 'all'
            ];
            $sc_dir = 'assets/service-cards/';
            $sc_images = is_dir($sc_dir) ? array_diff(scandir($sc_dir), array('..', '.')) : [];
            natsort($sc_images);
            foreach ($sc_images as $img):
                $img_path = $sc_dir . $img;
                if (!is_file($img_path)) continue;
                $base = pathinfo($img, PATHINFO_FILENAME);
                $cat = $catMap[$base] ?? 'all';
            ?>
            <div class="service-card" data-category="<?= htmlspecialchars($cat) ?>">
              <img src="<?= htmlspecialchars($img_path) ?>" alt="Service Card Image" class="sc-img" loading="lazy">
              <div class="sc-overlay"></div>
            </div>
            <?php endforeach; ?>
          </div>
        </div>
      </div>
    </div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOM 3 — PRODUCTS
     Image: 3-projects-wall.jpeg  |  Natural stone cladding + illuminated corridor right
     Doorway focal point: 78% 45%
     ═══════════════════════════════════════════════════════════════════════════ -->
<section class="room" id="room-products" data-room="3">
  <div class="room-bg">
    <img
      src="assets/images/3-projects-wall.jpeg"
      alt="Luxury natural ledger stone cladding feature wall with illuminated corridor passage and soft accent lighting"
      class="room-bg-img"
      data-origin="78% 45%"
      loading="lazy"
    >
    <div class="room-vignette room-vignette--right"></div>
    <div class="room-curtain" aria-hidden="true"></div>
  </div>

  <div class="room-content rc--center" id="products-content">
    <div class="glass-panel products-panel" id="products-panel">
      <div class="products-header">
        <p class="section-eyebrow section-eyebrow--center">Our Collection</p>
        <h2 class="section-title section-title--white section-title--center">Premium <em>Products</em></h2>
      </div>

      <div class="products-list-wrapper">
        <div class="products-list">
          <?php
          $products = [
            ['title' => 'Wallpaper', 'desc' => 'Premium 3D wallpapers for luxury interiors.', 'img' => 'ps1.jpg'],
            ['title' => 'Customized Wallpaper', 'desc' => 'Premium 3D & customized wallpapers for luxury interiors.', 'img' => 'ps2.jpeg'],
            ['title' => 'Marble Sheet', 'desc' => 'Durable, waterproof & modern flooring solutions.', 'img' => 'ps3.jpg'],
            ['title' => 'Foam Sheet', 'desc' => 'Stylish false ceiling design with premium finishing.', 'img' => 'ps4.jpg'],
            ['title' => 'Flooring Sheet', 'desc' => 'High-quality WPC panels for modern interiors.', 'img' => 'ps5.jpeg'],
            ['title' => 'Carpet', 'desc' => 'Elegant carpets for indoor decoration.', 'img' => 'ps6.jpeg'],
            ['title' => 'Grass', 'desc' => 'Maintenance-free green solutions for indoor & outdoor spaces.', 'img' => 'ps7.png'],
            ['title' => 'PU Stone', 'desc' => 'Durable and elegant stone solutions for flooring and decoration.', 'img' => 'ps8.png'],
            ['title' => '3D Wall Panel', 'desc' => 'Stylish 3D wall panels for modern interior designs.', 'img' => 'ps9.png'],
            ['title' => 'Mosaic Acrylic', 'desc' => 'Premium mosaic acrylic designs for elegant spaces.', 'img' => 'ps10.jpg'],
            ['title' => 'Mosaic Glass', 'desc' => 'Stylish mosaic glass panels for decorative walls.', 'img' => 'ps11.png'],
            ['title' => 'PVC/WPC', 'desc' => 'High-quality PVC/WPC sheets for durable interiors.', 'img' => 'ps12.png'],
            ['title' => 'Glass Film', 'desc' => 'Elegant and decorative glass films for windows & partitions.', 'img' => 'ps13.png'],
            ['title' => 'Moulding', 'desc' => 'Premium decorative mouldings that enhance walls, ceilings, and interiors with a stylish finish.', 'img' => 'ps14.jpeg'],
          ];
          $base_dir = 'assets/product-section/product-bg/';
          ?>
          <script>
            window.PRODUCT_DATA = <?= json_encode($products) ?>;
            window.PRODUCT_BASE_DIR = '<?= $base_dir ?>';
          </script>
          <?php
          foreach ($products as $index => $p):
            $layoutClass = ($index % 2 === 0) ? 'layout-left' : 'layout-right';
          ?>
          <article class="product-showcase <?= $layoutClass ?>">
            <div class="prd-img-wrap">
              <img src="<?= htmlspecialchars($base_dir . $p['img']) ?>" alt="<?= htmlspecialchars($p['title']) ?>" class="prd-img" loading="lazy">
            </div>
            <div class="prd-info">
              <h3 class="prd-title"><?= htmlspecialchars($p['title']) ?></h3>
              <p class="prd-desc"><?= htmlspecialchars($p['desc']) ?></p>
              <button class="btn btn-ghost prd-btn btn-view-product" data-product-index="<?= $index ?>">View More</button>
            </div>
          </article>
          <?php endforeach; ?>
        </div>
      </div>
      
      <div class="products-scroll-indicator" id="products-scroll-indicator">
        <span class="indicator-text">Scroll</span>
        <div class="indicator-line"></div>
      </div>

    </div>

    <!-- PRODUCT DETAILS PANEL -->
    <div class="glass-panel product-details-panel" id="product-details-panel">
      
      <div class="product-details-header">
        <button class="back-arrow-btn" id="close-product-details" aria-label="Back to Products">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back</span>
        </button>
      </div>
      
      <div class="product-details-scroll" id="product-details-scroll">
        <div class="details-intro">
          <p class="section-eyebrow section-eyebrow--center" id="pd-eyebrow">Exclusive Décor</p>
          <h2 class="section-title section-title--white section-title--center" id="pd-title">Redefine Your Space</h2>
          <p class="details-desc" id="pd-desc">At Daisy Decor, we create premium products that transform ordinary walls into stunning design statements.</p>
        </div>

        <div class="product-grid" id="pd-grid">
          <!-- Dynamic content injected via JS -->
        </div>
      </div>
    </div>
    
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOM 4 — WHY CHOOSE US
     Image: 4-why-chooseus-wall.jpeg  |  Terracotta/sage sculptural wave + arch corridor right
     Doorway focal point: 82% 50%
     ═══════════════════════════════════════════════════════════════════════════ -->
<section class="room" id="room-whyus" data-room="4">
  <div class="room-bg">
    <img
      src="assets/images/4-why-chooseus-wall.jpeg"
      alt="Sculptural terracotta and sage organic wave relief wall with a series of arched corridor passages"
      class="room-bg-img"
      data-origin="82% 50%"
      loading="lazy"
    >
    <div class="room-vignette room-vignette--bottom"></div>
    <div class="room-curtain" aria-hidden="true"></div>
  </div>

  <div class="room-content rc--bottom" id="whyus-content">
    <div class="whyus-header">
      <p class="section-eyebrow section-eyebrow--center">The Daisy Decor Difference</p>
      <h2 class="section-title section-title--center section-title--white">
        Where Precision<br>Meets <em>Artistry</em>
      </h2>
    </div>
    <div class="whyus-cards">
      <div class="why-card" id="why-1">
        <span class="wc-num">01</span>
        <h3>15+ Years of Mastery</h3>
        <p>A decade and a half refining our craft across residential, hospitality, and commercial projects worldwide.</p>
      </div>
      <div class="why-card" id="why-2">
        <span class="wc-num">02</span>
        <h3>Ethical Sourcing</h3>
        <p>Every material sourced with full provenance — certified quarries and sustainable mills only.</p>
      </div>
      <div class="why-card" id="why-3">
        <span class="wc-num">03</span>
        <h3>White-Glove Installation</h3>
        <p>Our craftsmen are trained in-house. No subcontractors — just skilled hands and your trust.</p>
      </div>
      <div class="why-card" id="why-4">
        <span class="wc-num">04</span>
        <h3>Design Consultation</h3>
        <p>Each project begins with an immersive consultation — mood boards, material samples, spatial studies.</p>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOM 5 — GALLERY
     Image: 5-gallery-wall.jpeg  |  Dark wood slat with gold geometric accent light
     Doorway focal point: 35% 65% (lit room at corridor end)
     ═══════════════════════════════════════════════════════════════════════════ -->
<section class="room" id="room-gallery" data-room="5">
  <div class="room-bg">
    <img
      src="assets/images/5-gallery-wall.jpeg"
      alt="Dark charcoal wood slat wall with geometric gold accent light cuts in a luxury corridor leading to a warmly lit room"
      class="room-bg-img"
      data-origin="35% 65%"
      loading="lazy"
    >
    <div class="room-vignette room-vignette--dark"></div>
    <div class="room-curtain" aria-hidden="true"></div>
  </div>

  <div class="room-content rc--center" id="gallery-content">
    <div class="gallery-text">
      <p class="section-eyebrow section-eyebrow--center">Visual Showcase</p>
      <h2 class="section-title section-title--white gallery-title">
        The Daisy Decor<br><em>Gallery</em>
      </h2>
      <p class="gallery-sub">
        Each installation, a confluence of material, light, and intention.<br>
        A surface that endures beyond the moment of its making.
      </p>
      <div class="gallery-thumbs">
        <figure class="gt-fig" id="gt-1">
          <img src="assets/images/1-hero-wall.jpeg" alt="Art Deco geometric gold wall panel" loading="lazy">
          <figcaption>Art Deco Series</figcaption>
        </figure>
        <figure class="gt-fig" id="gt-2">
          <img src="assets/images/2-service-wall.jpeg" alt="Walnut wood slat wall" loading="lazy">
          <figcaption>Walnut Slat</figcaption>
        </figure>
        <figure class="gt-fig" id="gt-3">
          <img src="assets/images/4-why-chooseus-wall.jpeg" alt="Sculptural wave wall" loading="lazy">
          <figcaption>Sculptural Relief</figcaption>
        </figure>
        <figure class="gt-fig" id="gt-4">
          <img src="assets/images/6-contact-wall.jpeg" alt="Marble feature wall" loading="lazy">
          <figcaption>Calacatta Marble</figcaption>
        </figure>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════════════════════════════════════════════════════════════
     ROOM 6 — CONTACT  (last room — no exit zoom)
     Image: 6-contact-wall.jpeg  |  Grand Calacatta marble + gold frame + green veining
     ═══════════════════════════════════════════════════════════════════════════ -->
<section class="room room--last" id="room-contact" data-room="6">
  <div class="room-bg">
    <img
      src="assets/images/6-contact-wall.jpeg"
      alt="Grand Calacatta marble feature wall with emerald green veining in a gold-framed luxury lobby"
      class="room-bg-img"
      data-origin="72% 48%"
      loading="lazy"
    >
    <div class="room-vignette room-vignette--contact"></div>
  </div>

  <div class="room-content rc--split" id="contact-content">
    <!-- Left: info -->
    <div class="contact-info">
      <p class="section-eyebrow">Begin Your Project</p>
      <h2 class="section-title contact-title">
        Let's Create<br>Something<br><em>Extraordinary</em>
      </h2>
      <div class="contact-details">
        <div class="cd-row" id="cd-studio">
          <span class="cd-label">Studio</span>
          <span class="cd-value">D3 Design District, Dubai, UAE</span>
        </div>
        <div class="cd-row" id="cd-email">
          <span class="cd-label">Email</span>
          <a href="mailto:hello@daisydecor.com" class="cd-value cd-link">hello@daisydecor.com</a>
        </div>
        <div class="cd-row" id="cd-phone">
          <span class="cd-label">Phone</span>
          <a href="tel:+97141234567" class="cd-value cd-link">+971 4 123 4567</a>
        </div>
      </div>
    </div>

    <!-- Right: form -->
    <div class="contact-form-wrap">
      <form class="contact-form" id="contact-form" novalidate method="POST" action="index.php">
        <div class="form-row">
          <div class="form-group">
            <label for="f-name">Full Name</label>
            <input type="text" id="f-name" name="name"
                   placeholder="Alexandra Monroe"
                   autocomplete="name" required>
          </div>
          <div class="form-group">
            <label for="f-email">Email Address</label>
            <input type="email" id="f-email" name="email"
                   placeholder="you@email.com"
                   autocomplete="email" required>
          </div>
        </div>
        <div class="form-group">
          <label for="f-service">Service Interest</label>
          <select id="f-service" name="service">
            <option value="">Select a service…</option>
            <option value="wood">Wood Cladding</option>
            <option value="stone">Stone Cladding</option>
            <option value="marble">Marble Finishing</option>
            <option value="bespoke">Bespoke Panels</option>
            <option value="full">Full Interior Package</option>
          </select>
        </div>
        <div class="form-group">
          <label for="f-vision">Your Vision</label>
          <textarea id="f-vision" name="vision" rows="4"
                    placeholder="Tell us about your space and what you envision…"></textarea>
        </div>
        <button type="submit" class="btn btn-gold btn-full" id="form-submit">
          <span class="btn-text">Send Enquiry</span>
          <span class="btn-icon">→</span>
        </button>
        <p class="form-success" id="form-success" aria-live="polite"></p>
        <p class="form-note">We respond within 24 hours. Your details are never shared.</p>
      </form>
    </div>
  </div>
</section>

<!-- ═══ FOOTER ═══════════════════════════════════════════════════════════════ -->
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="assets/images/logo.png" alt="Daisy Decor Logo" class="footer-logo-img" />
      <p class="footer-tag">Surfaces that speak. Spaces that endure.</p>
    </div>
    <nav class="footer-nav" aria-label="Footer navigation">
      <a href="#room-services">Services</a>
      <a href="#room-products">Products</a>
      <a href="#room-about">About</a>
      <a href="#room-gallery">Gallery</a>
      <a href="#room-contact">Contact</a>
    </nav>
    <p class="footer-copy">&copy; <?= $current_year ?> Daisy Decor. All rights reserved.</p>
  </div>
</footer>

<!-- Quick Contact Widget -->
<div class="contact-fab-container" id="contact-fab-container">
  <div class="contact-fab-buttons">
    <!-- Call Button -->
    <a href="tel:+97141234567" class="fab-btn fab-btn--call" aria-label="Call Us Now">
      <span class="fab-tooltip">Call Now</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    </a>
    <!-- WhatsApp Button -->
    <a href="https://wa.me/97141234567" target="_blank" rel="noopener noreferrer" class="fab-btn fab-btn--whatsapp" aria-label="Chat on WhatsApp">
      <span class="fab-tooltip">WhatsApp</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    </a>
  </div>
  <!-- Main Toggle Button -->
  <button class="fab-toggle" id="fab-toggle" aria-label="Toggle contact options" aria-expanded="false">
    <svg class="icon-chat" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg class="icon-close" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
</div>

<!-- ═══ SCRIPTS ═══════════════════════════════════════════════════════════════ -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script src="script.js"></script>

</body>
</html>
