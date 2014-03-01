/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var MyLayer = cc.Layer.extend({

    ctor:function() {
        this._super();
        cc.associateWithNative( this, cc.Layer );
    },

    init:function () {
        this.isReady = false,
        this.pipes = [],
        this.pipeState = [],
        this.score = 0,

        this._super();

        this.setTouchEnabled(true);

        this.createBack();
        this.createBird();
        this.initReady();
        this.initScore();

        return true;
    },

    createBack: function () {
        var winSize = cc.Director.getInstance().getWinSize();

        this.back = cc.Sprite.create(s_back);
        this.back.setAnchorPoint(cc.p(0.5, 0.5));
        this.back.setPosition(cc.p(winSize.width / 2, winSize.height / 2));
        this.addChild(this.back, 0);

        this.ground = cc.Sprite.create(s_ground);
        this.ground.setPosition(cc.p(this.ground.getContentSize().width / 2, 100));
        this.addChild(this.ground, 3);
        var move1 = cc.MoveBy.create(0.5, cc.p(-200, 0));
        var move2 = cc.MoveBy.create(0, cc.p(200, 0));
        this.ground.runAction(cc.RepeatForever.create(cc.Sequence.create(move1, move2)));
    },

    createBird: function () {
        var winSize = cc.Director.getInstance().getWinSize();

        this.bird = cc.Sprite.create(s_bird_1);
        this.bird.setAnchorPoint(cc.p(0.5, 0.5));
        this.bird.setPosition(cc.p(winSize.width / 4, winSize.height  / 2 + 200));
        this.addChild(this.bird, 5);

        var animation = cc.Animation.create();
        animation.addSpriteFrameWithFile(s_bird_1);
        animation.addSpriteFrameWithFile(s_bird_2);
        animation.addSpriteFrameWithFile(s_bird_3);
        animation.setDelayPerUnit(0.1);

        var animate = cc.Animate.create(animation);
        var action = cc.RepeatForever.create(animate);

        this.bird.runAction(action);
    },

    flyAction: function () {
        var animation = cc.Animation.create();
        animation.addSpriteFrameWithFile(s_bird_1);
        animation.addSpriteFrameWithFile(s_bird_2);
        animation.addSpriteFrameWithFile(s_bird_3);
        animation.setDelayPerUnit(0.1);

        var animate = cc.Animate.create(animation);
        var action = cc.RepeatForever.create(animate);

        return action;
    },

    createPipe: function (dis) {
        var winSize = cc.Director.getInstance().getWinSize();
        var acrossHeight = 250;
        var downHeight = 400 + (400 * Math.random() | 0);

        var n = (this.pipes.length / 2) | 0;
        var pipeX = dis + 400 * n;

        var pipeDown = cc.Sprite.create(s_pipe_bottom);
        pipeDown.setAnchorPoint(cc.p(0.5, 0));
        pipeDown.setPosition(cc.p(pipeX, downHeight - winSize.height));

        var pipeUp = cc.Sprite.create(s_pipe_top);
        pipeUp.setAnchorPoint(cc.p(0.5, 0));
        pipeUp.setPosition(cc.p(pipeX, downHeight + acrossHeight));

        this.addChild(pipeDown);
        this.addChild(pipeUp);

        var self = this;
        var moveDis = pipeX + 500;
        pipeUp.runAction(cc.Sequence.create(cc.MoveBy.create(moveDis/200, cc.p(-moveDis, 0)), cc.CallFunc.create(function () {
            pipeUp.removeFromParent(true);
        })));
        pipeDown.runAction(cc.Sequence.create(cc.MoveBy.create(moveDis/200, cc.p(-moveDis, 0)), cc.CallFunc.create(function () {
            self.createPipe(-500);
            var idx = self.pipes.indexOf(pipeDown); 
            self.pipes.splice(idx, 2);
            self.pipeState.splice(idx, 2);
            pipeDown.removeFromParent(true);
        })));

        this.pipes.push(pipeDown, pipeUp);
        this.pipeState.push(0, 0);
    },

    createPipes: function () {
        for (var i = 0; i < 4; i++) {
            this.createPipe(1200);
        }
    },

    onTouchesBegan: function (touches, event) {
        if (!this.isReady) {
            this.hideReady();
            this.createPipes();
            this.isReady = true;
            cc.Director.getInstance().getScheduler().scheduleCallbackForTarget(this, this.checkHit, 0.05, cc.REPEAT_FOREVER, 0, false);
        } 
        if (this.isReady) {
            var birdX = this.bird.getPositionX();
            var birdY = this.bird.getPositionY();
            var fallTime = birdY / 1000;
            var floorY = this.ground.getPositionY() + this.ground.getContentSize().height / 2 + this.bird.getContentSize().height / 2;

            this.bird.stopAllActions();
            this.bird.runAction(this.flyAction());

            var jump = cc.EaseOut.create(cc.MoveBy.create(0.3, cc.p(0, 120)), 2);
            var rotate = cc.RotateTo.create(0.3, -20);
            this.bird.runAction(cc.Spawn.create(jump, rotate));
            cc.log("Jump");

            var delay = cc.DelayTime.create(0.3);
            var fall = cc.EaseIn.create(cc.MoveTo.create(fallTime, cc.p(birdX, floorY)), 2);
            var self = this;
            var fallCallback = cc.CallFunc.create(function () {
                cc.log("== Fall ==");
                self.pipes.forEach(function(o){
                    o.stopAllActions();
                });
                self.bird.stopAllActions();
                self.ground.stopAllActions();
                self.gameOver();
            });
            this.bird.runAction(cc.Sequence.create(delay, fall, fallCallback));

            var delay = cc.DelayTime.create(0.5);
            var rotate = cc.EaseIn.create(cc.RotateTo.create(fallTime - 0.3, 90), 2);
            this.bird.runAction(cc.Sequence.create(delay, rotate));

            return true;
        }
    },

    checkHit: function () {
        var box = this.bird.getBoundingBox();
        var bottom = cc.p(box.x + box.width / 2, box.y);
        var right = cc.p(box.x + box.width, box.y + box.height / 2);
        var left = cc.p(box.x, box.y + box.height / 2);
        var top = cc.p(box.x + box.width / 2, box.y + box.height);

        var self = this;
        this.pipes.some(function (pipe, i) {

            var box = pipe.getBoundingBox();

            if (pipe.getPositionX() > 0 && pipe.getPositionX() < 640) {

                if (self.pipeState[i] == 0 && self.bird.getPositionX() > pipe.getPositionX()) {
                    self.score++;
                    var score = Math.floor(self.score / 2);
                    self.midScoreLabel.setString(score.toString());
                    self.pipeState[i] = 1;
                }

                if ((cc.rectContainsPoint(box, left)
                    || cc.rectContainsPoint(box, right)
                    || cc.rectContainsPoint(box, top)
                    || cc.rectContainsPoint(box, bottom))) {
                    
                    // hit
                    cc.log("== Hit ==");
                    self.pipes.forEach(function(o){
                        o.stopAllActions();
                    });
                    self.ground.stopAllActions();
                    self.setTouchEnabled(false);
                    cc.Director.getInstance().getScheduler().unscheduleCallbackForTarget(self, self.checkHit);
                    return true;
                } 
            }
        });
    },

    initReady: function () {
        var winSize = cc.Director.getInstance().getWinSize();

        this.readySprite = cc.Sprite.create(s_get_ready);
        this.readySprite.setPosition(cc.p(winSize.width / 2, winSize.height * 3 / 4));
        this.addChild(this.readySprite);

        this.tapTapSprite = cc.Sprite.create(s_tap_tap);
        this.tapTapSprite.setPosition(cc.p(winSize.width / 2, winSize.height / 2));
        this.addChild(this.tapTapSprite);
    },

    hideReady: function () {
        this.readySprite.runAction(cc.FadeOut.create(0.2));
        this.tapTapSprite.runAction(cc.FadeOut.create(0.2));
    },

    initScore: function () {
        var winSize = cc.Director.getInstance().getWinSize();

        this.midScoreLabel = cc.LabelTTF.create('0',  'Arial', 60, cc.size(60,60), cc.TEXT_ALIGNMENT_CENTER);
        this.midScoreLabel.setAnchorPoint(0.5, 0.5);
        this.midScoreLabel.setPosition(cc.p(winSize.width / 2, winSize.height / 2 + 400));
        this.addChild(this.midScoreLabel, 9);
    },

    gameOver: function () {
        var winSize = cc.Director.getInstance().getWinSize();
        var self = this;

        this.midScoreLabel.setVisible(false);

        var overSprite = cc.Sprite.create(s_game_over);
        overSprite.setPosition(winSize.width / 2, winSize.height / 2 + 200);
        this.addChild(overSprite, 10);

        var medalPlate = cc.Sprite.create(s_medal_plate);
        medalPlate.setPosition(cc.p(winSize.width / 2, winSize.height + 500));
        this.addChild(medalPlate, 10);
        medalPlate.runAction(cc.EaseIn.create(cc.MoveTo.create(0.5, cc.p(winSize.width / 2, winSize.height / 3 + 200)), 2));

        var score = Math.floor(self.score / 2);
        var scoreLabel = cc.LabelTTF.create(score.toString(),  'Arial', 48, cc.size(48, 48), cc.TEXT_ALIGNMENT_RIGHT);
        scoreLabel.setPosition(cc.p(380, 150));
        scoreLabel.setColor(cc.c3b(255, 153, 0));
        medalPlate.addChild(scoreLabel);

        var startButton = cc.MenuItemImage.create(
            s_start_1,
            s_start_2,
            function () {
                cc.Director.getInstance().replaceScene(cc.TransitionFade.create(0.5, new MyScene()));
            }, this);
        startButton.setAnchorPoint(cc.p(0.5, 0.5));
        startButton.setPosition(cc.p(winSize.width / 2, 400));
        startButton.runAction(cc.Sequence.create(cc.FadeOut.create(0), cc.DelayTime.create(1), cc.FadeIn.create(0.5)));

        var menu = cc.Menu.create(startButton);
        menu.setPosition(cc.p(0, 0));
        this.addChild(menu, 1);

        cc.Director.getInstance().getScheduler().unscheduleAllCallbacksForTarget(this);
    }

});

var MyScene = cc.Scene.extend({
    ctor:function() {
        this._super();
        cc.associateWithNative( this, cc.Scene );
    },

    onEnter:function () {
        this._super();
        var layer = new MyLayer();
        this.addChild(layer);
        layer.init();
    }
});
