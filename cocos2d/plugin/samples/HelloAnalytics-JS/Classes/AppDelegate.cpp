#include "AppDelegate.h"

#include "cocos2d.h"
#include "SimpleAudioEngine.h"
#include "ScriptingCore.h"
#include "jsb_cocos2dx_auto.hpp"
#include "jsb_cocos2dx_extension_auto.hpp"
#include "extension/jsb_cocos2dx_extension_manual.h"
#include "cocos2d_specifics.hpp"
#include "jsb_opengl_registration.h"
#include "localstorage/js_bindings_system_registration.h"
#include "chipmunk/js_bindings_chipmunk_registration.h"

#include "jsb_pluginx_protocols_auto.hpp"
#include "jsb_pluginx_extension_registration.h"

USING_NS_CC;
using namespace CocosDenshion;

AppDelegate::AppDelegate()
{
}

AppDelegate::~AppDelegate()
{
    ScriptEngineManager::destroyInstance();
}

bool AppDelegate::applicationDidFinishLaunching()
{
    // initialize director
    auto pDirector = Director::getInstance();
    pDirector->setOpenGLView(EGLView::getInstance());
    pDirector->setProjection(Director::Projection::_2D);

    auto designSize = Size(640, 960);
    EGLView::getInstance()->setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy::SHOW_ALL);

    // turn on display FPS
    pDirector->setDisplayStats(true);

    // set FPS. the default value is 1.0/60 if you don't call this
    pDirector->setAnimationInterval(1.0 / 60);

    ScriptingCore* sc = ScriptingCore::getInstance();
    sc->addRegisterCallback(register_all_cocos2dx);
    sc->addRegisterCallback(register_all_cocos2dx_extension);
    sc->addRegisterCallback(register_cocos2dx_js_extensions);
    sc->addRegisterCallback(jsb_register_chipmunk);
    sc->addRegisterCallback(register_all_cocos2dx_extension_manual);
    sc->addRegisterCallback(jsb_register_system);
    sc->addRegisterCallback(JSB_register_opengl);

    sc->addRegisterCallback(register_all_pluginx_protocols);
    sc->addRegisterCallback(register_pluginx_js_extensions);
    sc->start();

    ScriptEngineProtocol *pEngine = ScriptingCore::getInstance();
    ScriptEngineManager::getInstance()->setScriptEngine(pEngine);
    ScriptingCore::getInstance()->runScript("main.js");

    return true;
}

// This function will be called when the app is inactive. When comes a phone call,it's be invoked too
void AppDelegate::applicationDidEnterBackground()
{
    Director::getInstance()->stopAnimation();
    SimpleAudioEngine::getInstance()->pauseBackgroundMusic();
    SimpleAudioEngine::getInstance()->pauseAllEffects();
}

// this function will be called when the app is active again
void AppDelegate::applicationWillEnterForeground()
{
    Director::getInstance()->startAnimation();
    SimpleAudioEngine::getInstance()->resumeBackgroundMusic();
    SimpleAudioEngine::getInstance()->resumeAllEffects();
}
