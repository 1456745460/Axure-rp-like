#import <AppKit/AppKit.h>

@interface AppDelegate : NSObject <NSApplicationDelegate>
@property(nonatomic, strong) NSTask *service;
@property(nonatomic, strong) NSFileHandle *log;
@property(nonatomic) BOOL quitting;
@end

@implementation AppDelegate
- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    NSMenu *menu = [NSMenu new];
    NSMenuItem *appItem = [NSMenuItem new];
    [menu addItem:appItem];
    NSMenu *appMenu = [[NSMenu alloc] initWithTitle:@"Axure RP Like"];
    [[appMenu addItemWithTitle:@"打开 Axure RP Like" action:@selector(openBrowser:) keyEquivalent:@"o"] setTarget:self];
    [[appMenu addItemWithTitle:@"查看启动日志" action:@selector(openLog:) keyEquivalent:@"l"] setTarget:self];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItemWithTitle:@"退出 Axure RP Like" action:@selector(terminate:) keyEquivalent:@"q"];
    appItem.submenu = appMenu;
    NSApp.mainMenu = menu;

    NSString *project = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"AxureProjectDirectory"];
    NSString *launcher = [[NSBundle mainBundle] pathForResource:@"launcher" ofType:nil];
    if (!project || !launcher) {
        [self fail:@"应用文件不完整，请重新运行 scripts/install-macos-app.sh。"];
        return;
    }
    NSTask *process = [NSTask new];
    process.executableURL = [NSURL fileURLWithPath:@"/bin/bash"];
    process.arguments = @[launcher];
    process.currentDirectoryURL = [NSURL fileURLWithPath:project];
    NSMutableDictionary *environment = [[[NSProcessInfo processInfo] environment] mutableCopy];
    environment[@"AXURE_PROJECT_DIR"] = project;
    process.environment = environment;

    NSString *logPath = [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/Axure RP Like.log"];
    [[NSFileManager defaultManager] createDirectoryAtPath:[logPath stringByDeletingLastPathComponent]
                           withIntermediateDirectories:YES attributes:nil error:nil];
    [[NSFileManager defaultManager] createFileAtPath:logPath contents:nil attributes:nil];
    self.log = [NSFileHandle fileHandleForWritingAtPath:logPath];
    if (!self.log) {
        [self fail:@"无法写入 ~/Library/Logs/Axure RP Like.log。"];
        return;
    }
    process.standardOutput = self.log;
    process.standardError = self.log;
    process.standardInput = [NSFileHandle fileHandleWithNullDevice];
    __weak AppDelegate *weakSelf = self;
    process.terminationHandler = ^(NSTask *task) {
        dispatch_async(dispatch_get_main_queue(), ^{
            AppDelegate *delegate = weakSelf;
            if (!delegate) return;
            if (delegate.quitting) {
                [NSApp replyToApplicationShouldTerminate:YES];
            } else {
                [delegate fail:[NSString stringWithFormat:@"项目服务已停止（退出码 %d）。\n请查看 ~/Library/Logs/Axure RP Like.log。", task.terminationStatus]];
            }
        });
    };
    NSError *error = nil;
    if (![process launchAndReturnError:&error]) {
        [self fail:[NSString stringWithFormat:@"启动失败：%@", error.localizedDescription]];
        return;
    }
    self.service = process;
}

- (void)openBrowser:(id)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:@"http://localhost:5173"]];
}

- (void)openLog:(id)sender {
    [[NSWorkspace sharedWorkspace] openURL:[NSURL fileURLWithPath:
        [NSHomeDirectory() stringByAppendingPathComponent:@"Library/Logs/Axure RP Like.log"]]];
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender hasVisibleWindows:(BOOL)flag {
    [self openBrowser:nil];
    return YES;
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(NSApplication *)sender {
    if (!self.service.running) return NSTerminateNow;
    if (!self.quitting) {
        self.quitting = YES;
        [self.service terminate];
    }
    return NSTerminateLater;
}

- (void)fail:(NSString *)message {
    NSAlert *alert = [NSAlert new];
    alert.messageText = @"Axure RP Like";
    alert.informativeText = message;
    alert.alertStyle = NSAlertStyleWarning;
    [alert addButtonWithTitle:@"好"];
    [NSApp activateIgnoringOtherApps:YES];
    [alert runModal];
    [NSApp terminate:nil];
}
@end

int main(void) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        AppDelegate *delegate = [AppDelegate new];
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];
        app.delegate = delegate;
        [app run];
    }
    return 0;
}
