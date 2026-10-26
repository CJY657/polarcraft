"""Browser acceptance for the standalone preview; requires Python Playwright and Chrome."""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
errors = []
checks = []
playwright = sync_playwright().start()
browser = playwright.chromium.launch(
    executable_path=os.environ.get("PREVIEW_CHROME", "/home/cjy/.local/bin/google-chrome"),
    headless=True,
    args=["--no-sandbox", "--disable-dev-shm-usage"],
)
page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
page.on("pageerror", lambda error: errors.append(str(error)))
page.goto(os.environ.get("PREVIEW_URL", "http://127.0.0.1:4176/calcite-book/"), wait_until="networkidle")
page.wait_for_function("document.getElementById('loading').hidden")
page.wait_for_timeout(500)
page.screenshot(path=str(ROOT / "screenshots/cover.png"))
page.locator("#open-book").click()
page.wait_for_function("opening === 1 && foundationReveal === 1")
assert page.locator("#experiment").is_visible()
assert page.locator("#previous").is_disabled()
page.screenshot(path=str(ROOT / "screenshots/desktop.png"))
assert page.locator('[data-page]').count() == 7
checks.append("Cover opens into seven-lesson book; wave controls appear; first-page boundary holds")

assert page.locator("#wave-controls").is_visible()
assert page.locator("#calcite-controls").is_hidden()
assert page.evaluate("foundation.visible && waveScene.visible && !polarizationScene.visible && !wordPlane.visible")
assert page.evaluate("waveE.isMesh && waveERibbon.isMesh && waveB.isMesh && waveBRibbon.isMesh && waveEVectors.length === 7 && waveBVectors.length === 6")
page.locator("#wave-length").fill("700")
assert page.locator("#wave-length-value").inner_text() == "700 nm"
assert page.locator("#wave-frequency").inner_text() == "4.28 × 10¹⁴ Hz"
page.locator("#wave-amplitude").fill("75")
page.locator("#show-b").uncheck()
page.wait_for_function("waveB.visible === false")
assert page.locator("#task-progress").inner_text() == "3 / 3"
page.locator("#text-toggle").click()
assert "c = λf" in page.locator("#transcript-content").inner_text()
assert "700 nm" in page.locator("#transcript-content").inner_text()
page.keyboard.press("Escape")
page.locator("#reset").click()
assert page.locator("#wave-length").input_value() == "550"
assert page.locator("#show-b").is_checked()
page.screenshot(path=str(ROOT / "screenshots/wave-desktop.png"))
page.set_viewport_size({"width": 390, "height": 844})
page.wait_for_timeout(300)
page.screenshot(path=str(ROOT / "screenshots/wave-mobile.png"))
page.set_viewport_size({"width": 1440, "height": 1000})
page.wait_for_timeout(300)
checks.append("Wave mesh ribbons, field vectors, wavelength/frequency, amplitude, B-field layer, tasks, text view, reset, and desktop/mobile captures pass")

page.locator("#next").click()
page.wait_for_function("turn === 0 && foundationReveal === 1")
assert "偏振类型与表示" in page.locator("#page-title").inner_text()
assert page.locator("#polarization-controls").is_visible()
assert page.evaluate("polarizationE.isMesh && polarizationRibbon.isMesh && polarizationEllipse.isMesh && polarizationReceiver.visible && polarizationScene.rotation.y < 0")
assert page.locator("#polarization-state").inner_text() == "45° 线偏振"
assert page.locator("#ellipse-psi").inner_text() == "45.0°"
for preset, expected, chi in [("right", "右旋圆偏振", "45.0°"), ("left", "左旋圆偏振", "-45.0°"), ("elliptical", "椭圆偏振", "19.3°")]:
    page.locator(f'[data-polarization="{preset}"]').click()
    assert page.locator("#polarization-state").inner_text() == expected
    assert page.locator("#ellipse-chi").inner_text() == chi
page.locator('[data-polarization="linear"]').click()
page.locator("#phase-diff").fill("180")
assert page.locator("#polarization-state").inner_text() == "135° 线偏振"
page.locator("#amp-x").fill("0")
page.locator("#amp-y").fill("0")
assert "无偏振态" in page.locator("#polarization-state").inner_text()
page.wait_for_function("!polarizationVector.visible && !polarizationEllipse.visible && !polarizationE.visible")
page.locator("#reset").click()
page.locator('[data-polarization="right"]').click()
assert page.locator("#task-progress").inner_text() == "3 / 3"
page.locator('[data-polarization="elliptical"]').click()
assert page.locator("#task-progress").inner_text() == "3 / 3"
page.locator('[data-polarization="right"]').click()
page.wait_for_function("polarizationVector.visible && polarizationEllipse.visible")
page.screenshot(path=str(ROOT / "screenshots/polarization-desktop.png"))
page.set_viewport_size({"width": 390, "height": 844})
page.wait_for_timeout(300)
page.screenshot(path=str(ROOT / "screenshots/polarization-mobile.png"))
page.set_viewport_size({"width": 1440, "height": 1000})
page.wait_for_timeout(300)
page.wait_for_function("document.getElementById('scene').style.cursor === 'grab'")
before_orbit = page.evaluate("({x: polarizationScene.rotation.x, y: polarizationScene.rotation.y})")
page.mouse.move(850, 490)
page.mouse.down()
page.mouse.move(1000, 555, steps=8)
page.mouse.up()
after_orbit = page.evaluate("({x: polarizationScene.rotation.x, y: polarizationScene.rotation.y})")
assert abs(after_orbit["y"] - before_orbit["y"]) > .8
assert after_orbit["x"] > before_orbit["x"] + .2
page.screenshot(path=str(ROOT / "screenshots/polarization-orbit.png"))
page.locator("#reset").click()
assert page.evaluate("polarizationScene.rotation.x === 0 && polarizationScene.rotation.y === POLARIZATION_DEFAULT_Y")
checks.append("Linear/circular/elliptical mesh synthesis, rotating receiver vector, pointer orbit with bounded pitch, reset view, ψ/χ readouts, zero-amplitude hiding, tasks, presets, and desktop/mobile captures pass")

page.locator("#next").click()
page.wait_for_function("turn === 0 && foundationReveal === 1")
assert "布儒斯特角" in page.locator("#page-title").inner_text()
assert page.locator("#page-count").inner_text().startswith("03 / 07")
assert page.locator("#brewster-controls").is_visible()
assert page.locator("#polarization-controls").is_hidden()
assert page.evaluate("brewsterScene.visible && !polarizationScene.visible && !waveScene.visible")
page.locator("#brewster-angle").fill("90")
page.wait_for_function("!brewsterRefractedRay.group.visible && !brewsterRefractedLabel.visible && brewsterFlow.filter(dot => dot.userData.ray === 'refracted').every(dot => !dot.visible)")
assert page.locator("#brewster-rp").inner_text() == "100.00%"
assert page.locator("#brewster-rs").inner_text() == "100.00%"
page.locator('[data-brewster-angle="0"]').click()
page.wait_for_function("brewsterRefractedRay.group.visible && brewsterRefractedLabel.visible && brewsterFlow.filter(dot => dot.userData.ray === 'refracted').every(dot => dot.visible)")
normal = page.evaluate("({rp: brewsterModel().rp, rs: brewsterModel().rs})")
assert abs(normal["rp"] - .04) < 1e-8 and abs(normal["rs"] - .04) < 1e-8
assert page.locator("#brewster-rp").inner_text() == "4.00%"
assert page.locator("#brewster-rs").inner_text() == "4.00%"
for angle in (55, 58):
    page.locator("#brewster-angle").fill(str(angle))
    page.wait_for_function("!brewsterModel().atBrewster && brewsterReflectedP.visible && !brewsterRightAngle.visible")
    assert 0 < page.evaluate("brewsterModel().rp") < .0005
page.locator("#brewster-set").click()
page.wait_for_function("brewsterModel().atBrewster && brewsterRightAngle.visible && !brewsterReflectedP.visible")
assert abs(page.evaluate("state.brewsterAngle") - 56.309932474) < 1e-6
assert page.evaluate("brewsterModel().rp") < 1e-8
assert page.evaluate("brewsterScene.userData.perpendicular")
assert page.locator("#task-progress").inner_text() == "2 / 3"
page.screenshot(path=str(ROOT / "screenshots/brewster-desktop.png"))
page.set_viewport_size({"width": 390, "height": 844})
page.wait_for_timeout(300)
page.screenshot(path=str(ROOT / "screenshots/brewster-mobile.png"))
for width, height in [(375, 667), (640, 900), (768, 1024), (1024, 768), (1280, 900)]:
    page.set_viewport_size({"width": width, "height": height})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
    panel = page.locator("#experiment").bounding_box()
    assert panel["y"] >= 0 and panel["y"] + panel["height"] <= height, (width, panel)
page.set_viewport_size({"width": 1440, "height": 1000})
page.wait_for_timeout(300)
page.locator("#brewster-medium").select_option("water")
assert page.locator("#brewster-theta-b").inner_text() == "53.1°"
assert page.locator("#task-progress").inner_text() == "3 / 3"
page.locator("#brewster-set").click()
assert page.evaluate("brewsterModel().atBrewster && Math.abs(brewsterModel().n2 - 1.33) < 1e-8")
page.wait_for_function("brewsterScene.userData.perpendicular && brewsterRightAngle.visible && !brewsterReflectedP.visible")
page.locator("#brewster-medium").select_option("diamond")
assert page.locator("#brewster-theta-b").inner_text() == "67.5°"
page.locator("#brewster-set").click()
assert page.evaluate("brewsterModel().atBrewster && brewsterModel().rp < 1e-8")
page.wait_for_function("brewsterScene.userData.perpendicular && brewsterRightAngle.visible && !brewsterReflectedP.visible")
page.locator("#text-toggle").click()
assert "tan θB = n₂/n₁" in page.locator("#transcript-content").inner_text()
assert "金刚石" in page.locator("#transcript-content").inner_text()
page.keyboard.press("Escape")
before_brewster_orbit = page.evaluate("({x: brewsterScene.rotation.x, y: brewsterScene.rotation.y})")
page.mouse.move(850, 490)
page.mouse.down()
page.mouse.move(980, 550, steps=8)
page.mouse.up()
after_brewster_orbit = page.evaluate("({x: brewsterScene.rotation.x, y: brewsterScene.rotation.y})")
assert abs(after_brewster_orbit["y"] - before_brewster_orbit["y"]) > .6
assert after_brewster_orbit["x"] > before_brewster_orbit["x"] + .15
page.screenshot(path=str(ROOT / "screenshots/brewster-orbit.png"))
page.locator("#reset").click()
assert page.locator("#brewster-medium").input_value() == "glass"
assert page.locator("#brewster-angle").input_value() == "45"
assert page.evaluate("brewsterScene.rotation.x === 0 && brewsterScene.rotation.y === BREWSTER_DEFAULT_Y")
checks.append("Brewster Snell/Fresnel model, normal/grazing incidence, exact θB for three media, p-marker visibility near θB and extinction at θB, perpendicular rays, tasks, text view, pointer orbit/reset, responsive bounds, and desktop/mobile captures pass")

page.locator("#next").click()
page.wait_for_function("turn === 0")
assert "一个字，两个像" in page.locator("#page-title").inner_text()
assert page.locator("#calcite-controls").is_visible()
assert page.evaluate("crystal.visible && wordPlane.visible && !foundation.visible")
page.locator("#crystal-angle").fill("90")
assert page.locator("#crystal-value").inner_text() == "90°"
assert abs(page.evaluate("crystal.rotation.y") + 1.57079632679) < 0.00001
assert "90°" in page.locator("#tasks").inner_text()
assert page.locator("#tasks .done").count() == 2
page.locator("#reset").click()
assert page.locator("#crystal-value").inner_text() == "0°"
checks.append("Crystal control updates actual 3D rotation; observation tasks and reset work")

page.locator("#next").click()
assert "转动晶体" in page.locator("#page-title").inner_text()
page.locator("#next").click()
page.wait_for_function("turn === 0")
assert page.locator("#analyzer").is_checked()
for angle, expected in [(0, ["50%", "0%"]), (45, ["25%", "25%"]), (90, ["0%", "50%"]), (180, ["50%", "0%"])]:
    page.locator("#analyzer-angle").fill(str(angle))
    actual = [page.locator("#o-value").inner_text(), page.locator("#e-value").inner_text()]
    assert actual == expected, (angle, actual)
page.locator('[data-angle="45"]').click()
assert page.locator("#tasks .done").count() == 3
page.screenshot(path=str(ROOT / "screenshots/analyzer.png"))
checks.append("Natural input: 0/45/90/180 degree analyzer intensities and all polarization tasks pass")

page.locator("#advanced summary").click()
page.locator("#source").select_option("linear")
page.locator("#source-angle").fill("0")
page.locator('[data-angle="0"]').click()
assert [page.locator("#o-value").inner_text(), page.locator("#e-value").inner_text()] == ["100%", "0%"]
page.locator("#source-angle").fill("90")
page.locator('[data-angle="90"]').click()
assert [page.locator("#o-value").inner_text(), page.locator("#e-value").inner_text()] == ["0%", "100%"]
page.locator("#source-angle").fill("45")
page.locator('[data-angle="45"]').click()
assert [page.locator("#o-value").inner_text(), page.locator("#e-value").inner_text()] == ["25%", "25%"]
page.locator("#reset").click()
assert page.locator("#source").input_value() == "natural"
checks.append("Linear input uses cos²φ/sin²φ before the analyzer; reset restores natural light")

page.locator("#text-toggle").click()
assert page.locator("#transcript").is_visible()
assert "让一个像消失" in page.locator("#transcript-content").inner_text()
assert "平行晶面" in page.locator("#transcript-content").inner_text()
page.keyboard.press("Escape")
assert page.locator("#transcript").is_hidden()
page.locator("#contents-toggle").click()
page.locator('[data-page="6"]').click()
assert page.locator("#next").is_disabled()
assert page.locator("#contents").is_hidden()
assert page.locator("#advanced").get_attribute("open") is not None
page.locator("#scene").focus()
page.keyboard.press("ArrowLeft")
assert "让一个像消失" in page.locator("#page-title").inner_text()
page.wait_for_function("turn === 0")
checks.append("Expanded text view, Escape, contents, page boundaries, and keyboard navigation work")

page.locator("#next").click()
page.wait_for_function("turn === 0")
baseline = page.evaluate("opticsModel().separation")
page.locator("#thickness").fill("12")
thicker = page.evaluate("opticsModel().separation")
assert abs(thicker - baseline * 1.5) < 0.00001
page.locator("#wavelength").select_option("400")
model = page.evaluate("({ nO: opticsModel().nO, nE: opticsModel().nE, separation: opticsModel().separation })")
assert model["nO"] == 1.681 and model["nE"] == 1.497 and model["separation"] > 0
page.locator("#axis-mode").click()
page.wait_for_function("beamE.visible === false")
assert page.evaluate("opticsModel().separation") == 0
assert page.evaluate("opticsModel().walkoff") == 0
assert page.locator("#task-progress").inner_text() == "2 / 3"
page.screenshot(path=str(ROOT / "screenshots/optical-axis.png"))
page.locator("#axis-mode").click()
page.wait_for_function("beamE.visible === true")
assert page.locator("#task-progress").inner_text() == "3 / 3"
page.locator("#show-rays").uncheck()
page.wait_for_function("beamO.visible === false && photons.visible === false")
page.locator("#show-rays").check()
page.locator("#show-axis").uncheck()
page.wait_for_function("axisGuide.visible === false")
page.locator("#show-axis").check()
page.screenshot(path=str(ROOT / "screenshots/advanced.png"))
checks.append("Thickness, dispersion, optical-axis degeneracy, layer toggles, and principle tasks pass")

page.locator('[data-page="5"]').evaluate("button => button.click()")
page.locator('[data-angle="45"]').click()
page.locator("#panel-toggle").click()
assert page.locator("#panel-toggle").get_attribute("aria-expanded") == "false"
assert page.locator("#experiment").bounding_box()["height"] < 70
page.locator("#panel-toggle").click()
assert page.locator("#panel-toggle").get_attribute("aria-expanded") == "true"
checks.append("Experiment panel collapses and expands without losing the current state")

page.set_viewport_size({"width": 390, "height": 844})
page.wait_for_timeout(300)
page.screenshot(path=str(ROOT / "screenshots/mobile.png"))
for width, height in [(375, 667), (640, 900), (768, 1024), (1024, 768), (1280, 900), (1440, 1000)]:
    page.set_viewport_size({"width": width, "height": height})
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), width
    capsule = page.locator(".capsule").bounding_box()
    panel = page.locator("#experiment").bounding_box()
    assert capsule["y"] >= 0 and capsule["y"] + capsule["height"] <= height, (width, capsule)
    assert panel["y"] >= 0 and panel["y"] + panel["height"] <= height, (width, panel)
checks.append("390px capture and 375/640/768/1024/1280/1440px overflow and panel-bounds sweep pass")

page.evaluate("window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
page.wait_for_timeout(100)
assert page.evaluate("frame > 0")
page.emulate_media(reduced_motion="reduce")
page.wait_for_function("document.getElementById('motion').getAttribute('aria-pressed') === 'true'")
assert page.locator("#motion").get_attribute("aria-pressed") == "true"
page.locator("#close-book").click()
assert page.locator("#open-book").is_visible()
checks.append("Restored-page render loop, reduced motion, and close/reopen entry pass")
assert not errors, errors
report = {
    "checks": checks,
    "page_errors": errors,
    "scope": "Standalone seven-lesson preview; ideal EM-wave, polarization and Fresnel/Brewster visualizations plus index-ellipsoid walk-off for near-normal incidence on parallel faces, not arbitrary ray tracing",
}
(ROOT / "validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report, ensure_ascii=False), flush=True)
browser.close()
playwright.stop()
