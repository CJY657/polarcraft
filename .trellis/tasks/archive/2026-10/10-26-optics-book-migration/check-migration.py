"""Built-app acceptance. Run from the repository root with the preview on port 4178."""
import json
import os
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

BASE = os.environ.get("MIGRATION_URL", "http://127.0.0.1:4178")
OUT = Path(__file__).resolve().parent / "evidence" / "app"
OUT.mkdir(parents=True, exist_ok=True)
BOOK_TITLE = "一束光的两种旅程 · 光学基础实验书"
ALIASES = [("em-wave", 0), ("polarization-types", 1), ("brewster-angle", 2), ("birefringence-iceland-spar", 3)]
WIDTHS = [(375, 667), (390, 844), (640, 900), (768, 1024), (1024, 768), (1280, 900), (1440, 1000)]
report = {"checks": [], "page_errors": [], "asset_failures": [], "backend_failures": [], "navigation_cancellations": [], "geometry": [], "defects": [], "environment_notes": ["Pre-existing external Google Fonts CSS is fulfilled with an empty stylesheet because the QA network times out; all local app/book/font assets remain unchanged."]}
requested = []
normalizing_legacy_link = False


def checked(message):
    report["checks"].append(message)
    print(message, flush=True)


def book_frame(page):
    element = page.get_by_title(BOOK_TITLE)
    element.wait_for()
    frame = element.element_handle().content_frame()
    frame.wait_for_function("document.getElementById('loading')?.hidden && typeof state !== 'undefined'")
    return frame


def open_cover(frame, expected):
    assert frame.evaluate("state.open === false"), "Entry skipped the closed cover"
    assert frame.locator("#open-book").is_visible()
    frame.locator("#open-book").click()
    frame.wait_for_function("opening === 1")
    assert frame.evaluate("state.page") == expected
    assert frame.locator("#page-count").inner_text().startswith(f"{expected + 1:02d} / 07")


def no_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), page.viewport_size


def assert_book_bounds(page, frame):
    no_overflow(page)
    assert frame.evaluate("document.documentElement.scrollWidth <= innerWidth")
    iframe = page.get_by_title(BOOK_TITLE).bounding_box()
    viewport = page.viewport_size
    assert abs(iframe["x"]) <= 1 and abs(iframe["y"]) <= 1
    if abs(iframe["width"] - viewport["width"]) > 1:
        report["defects"].append({"kind": "iframe_width", "viewport": viewport, "iframe": iframe, "document": page.evaluate("({innerWidth, clientWidth: document.documentElement.clientWidth, rootWidth: document.getElementById('root').getBoundingClientRect().width, gutter: getComputedStyle(document.documentElement).scrollbarGutter})")})
    assert abs(iframe["height"] - viewport["height"]) <= 1
    assert page.locator("header, footer, aside").count() == 0
    origin = frame.locator(".book-origin").bounding_box()
    reading = frame.locator("#text-toggle").bounding_box()
    assert origin["x"] + origin["width"] <= reading["x"] + 1, (viewport, origin, reading)
    for selector in (".capsule", "#experiment"):
        bounds = frame.locator(selector).bounding_box()
        assert bounds["y"] >= -1 and bounds["y"] + bounds["height"] <= viewport["height"] + 1, (viewport, selector, bounds)
    report["geometry"].append({"viewport": viewport, "iframe": iframe, "topline_origin": origin, "topline_reading": reading})


def response_status(response):
    if response.status < 400:
        return
    entry = {"url": response.url, "status": response.status}
    if "/api/" in response.url:
        report["backend_failures"].append(entry)
    elif response.url.startswith(BASE):
        report["asset_failures"].append(entry)


def request_failure(request):
    entry = {"url": request.url, "failure": request.failure}
    if (normalizing_legacy_link and request.resource_type == "document"
            and urlparse(request.url).path == "/optics-book/index.html"
            and request.failure == "net::ERR_ABORTED"):
        report["navigation_cancellations"].append(entry)
    else:
        report["backend_failures" if "/api/" in request.url else "asset_failures"].append(entry)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=os.environ.get("PREVIEW_CHROME", "/home/cjy/.local/bin/google-chrome"),
        headless=True,
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
    page.route("https://fonts.googleapis.com/**", lambda route: route.fulfill(status=200, content_type="text/css", body=""))
    page.on("pageerror", lambda error: report["page_errors"].append(str(error)))
    page.on("request", lambda request: requested.append(request.url))
    page.on("response", response_status)
    page.on("requestfailed", request_failure)
    try:
        page.goto(BASE + "/demos", wait_until="domcontentloaded")
        book = page.locator('a[href="/demos/optics-book"]')
        book.wait_for()
        basics = page.get_by_role("region", name="光学基础")
        polarization = page.get_by_role("region", name="偏振态")
        assert basics.locator('a[href="/demos/optics-book"]').count() == 1
        assert basics.get_by_role("button").count() == 0
        assert polarization.get_by_role("button").count() == 2
        assert basics.bounding_box()["y"] < polarization.bounding_box()["y"]
        assert page.locator("iframe").count() == 0
        assert not any("/optics-book/book.js" in url or "/optics-book/assets/three" in url for url in requested)
        assert book.locator("img").evaluate("image => image.complete && image.naturalWidth > 0")
        page.screenshot(path=str(OUT / "gallery-desktop.png"), full_page=True)
        for width, height in WIDTHS:
            page.set_viewport_size({"width": width, "height": height})
            no_overflow(page)
        page.set_viewport_size({"width": 390, "height": 844})
        page.screenshot(path=str(OUT / "gallery-mobile.png"), full_page=True)
        checked("Gallery: one static book entry above two polarization experiments; real cover loads; no book WebGL runtime preloaded; seven-width overflow sweep passes")

        page.set_viewport_size({"width": 1440, "height": 1000})
        book.click()
        frame = book_frame(page)
        assert frame.locator(".back-link").get_attribute("href") == "/demos"
        assert frame.locator(".back-link").get_attribute("target") == "_top"
        page.screenshot(path=str(OUT / "cover-desktop.png"))
        open_cover(frame, 0)
        assert_book_bounds(page, frame)
        page.screenshot(path=str(OUT / "book-desktop.png"))
        for width, height in WIDTHS:
            page.set_viewport_size({"width": width, "height": height})
            assert_book_bounds(page, frame)
        page.set_viewport_size({"width": 390, "height": 844})
        frame.locator("#text-toggle").click()
        assert frame.locator("#transcript").is_visible()
        assert "光的本质" in frame.locator("#transcript-content").inner_text()
        page.screenshot(path=str(OUT / "book-mobile-reading.png"))
        frame.locator("#text-close").click()
        page.screenshot(path=str(OUT / "book-mobile.png"))
        checked("Canonical entry: manual closed cover, chapter 1, full viewport without global chrome; mobile text view and seven-width frame/control bounds pass")

        frame.locator(".back-link").click()
        page.wait_for_url(BASE + "/demos")
        page.locator('a[href="/demos/optics-book"]').wait_for()
        assert page.locator("iframe").count() == 0
        page.go_back(wait_until="domcontentloaded")
        frame = book_frame(page)
        frame.wait_for_function("frame > 0")
        before_frame = frame.evaluate("frame")
        frame.wait_for_function("previous => frame !== previous", arg=before_frame)
        page.go_forward(wait_until="domcontentloaded")
        page.locator('a[href="/demos/optics-book"]').wait_for()
        checked("Return link navigates the top window to the gallery; browser back restores an active renderer and forward returns to gallery")

        page.set_viewport_size({"width": 1280, "height": 900})
        page.emulate_media(reduced_motion="reduce")
        for legacy_query in (False, True):
            normalizing_legacy_link = legacy_query
            for alias, expected in ALIASES:
                path = f"/demos?demo={alias}&from=course" if legacy_query else f"/demos/{alias}?from=course"
                page.goto(BASE + path, wait_until="domcontentloaded")
                page.wait_for_url(BASE + f"/demos/{alias}?from=course")
                frame = book_frame(page)
                open_cover(frame, expected)
                assert_book_bounds(page, frame)
        normalizing_legacy_link = False
        checked("All four old paths and all four legacy query links preserve extra parameters and manually open their matching chapter")

        page.emulate_media(reduced_motion="no-preference")
        page.goto(BASE + "/demos/color-state", wait_until="domcontentloaded")
        page.get_by_role("heading", name="量糖计与旋光色散", exact=True).wait_for()
        assert page.locator("header").count() > 0
        assert page.get_by_role("navigation", name="演示目录").count() > 0
        assert page.locator("canvas").count() > 0
        concentration = page.get_by_label("糖浓度", exact=True)
        assert concentration.input_value() == "0.6"
        page.get_by_role("button", name="0.8 g/mL", exact=True).click()
        assert concentration.input_value() == "0.8"
        assert "0.80 g/mL" in page.locator("body").inner_text()
        page.screenshot(path=str(OUT / "unit1-color-state.png"))
        checked("Unit1 saccharimeter retains its normal header/directory/canvas; concentration preset updates the actual slider/readout")

        page.goto(BASE + "/demos/visuphy-polarization", wait_until="domcontentloaded")
        page.get_by_role("heading", name="3D 偏振光路模拟器", exact=True).wait_for()
        assert page.locator("header").count() > 0
        assert page.get_by_role("navigation", name="演示目录").count() > 0
        visuphy_element = page.get_by_title("3D Polarization Optical Path Simulator")
        visuphy = visuphy_element.element_handle().content_frame()
        visuphy.wait_for_selector("#elements-table tbody tr")
        before = visuphy.locator("#elements-table tbody tr").count()
        visuphy.locator("#add-element").select_option("QWP")
        visuphy.locator("#add-element-btn").click()
        assert visuphy.locator("#elements-table tbody tr").count() == before + 1
        assert visuphy.locator("#visualizationCanvas").evaluate("canvas => canvas.width > 0 && canvas.height > 0")
        page.screenshot(path=str(OUT / "unit1-visuphy.png"))
        checked("Unit1 3D simulator retains its header/directory, renders canvas/table, and adds a quarter-wave plate")

        assert not report["page_errors"], report["page_errors"]
        unexpected_assets = [item for item in report["asset_failures"] if item["url"].startswith(BASE)]
        assert not unexpected_assets, unexpected_assets
        assert not report["defects"], report["defects"]
        report["result"] = "passed"
        (OUT / "failure.png").unlink(missing_ok=True)
    except Exception as error:
        report["result"] = "failed"
        report["failure"] = repr(error)
        page.screenshot(path=str(OUT / "failure.png"), full_page=True)
        raise
    finally:
        (OUT / "validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        browser.close()

print(json.dumps({"result": report["result"], "checks": report["checks"], "page_errors": report["page_errors"], "asset_failures": report["asset_failures"], "backend_failures": report["backend_failures"]}, ensure_ascii=False), flush=True)
