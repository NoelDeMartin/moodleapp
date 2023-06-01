import { useEffect, useGlobals } from '@storybook/addons';

function withIonicMode(StoryFn) {
    const [{ ionicMode }] = useGlobals();

    useEffect(() => {
        if (!ionicMode) {
            return;
        }

        const url = new URL(window.parent.location.href);
        const original = url.searchParams.get('ionicMode');

        url.searchParams.set('ionicMode', ionicMode);
        window.parent.history.replaceState(undefined, document.title, url.href);

        if (original && ionicMode !== original) {
            window.location.reload();
        }
    }, [ionicMode]);

    return StoryFn();
};

export var decorators = [withIonicMode];
